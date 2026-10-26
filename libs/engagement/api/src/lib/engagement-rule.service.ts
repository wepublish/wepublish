import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EngagementAction as PEngagementAction,
  EngagementEnforcement,
  EngagementRule as PEngagementRule,
  EngagementStage as PEngagementStage,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { EvaluatedRule, ReferralParam } from './evaluate';
import {
  CreateEngagementRuleInput,
  EngagementStageInput,
  UpdateEngagementRuleInput,
} from './engagement-rule.model';
import { validateEngagementRule } from './validate-engagement-rule';

export type EngagementStageWithActions = Omit<
  PEngagementStage,
  'description'
> & {
  description: RichtextJSONDocument | null;
  actions: PEngagementAction[];
};

/** A rule as resolvers and the evaluation see it. */
export type EngagementRuleWithStages = Omit<
  PEngagementRule,
  'newsletterParams'
> &
  EvaluatedRule<EngagementStageWithActions> & {
    newsletterParams: ReferralParam[];
  };

const include = {
  showOnPages: { select: { id: true } },
  stages: {
    orderBy: { afterArticles: 'asc' },
    include: { actions: { orderBy: { id: 'asc' } } },
  },
} satisfies Prisma.EngagementRuleInclude;

type StoredRule = Prisma.EngagementRuleGetPayload<{ include: typeof include }>;

const isReferralParam = (value: unknown): value is ReferralParam =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as ReferralParam).key === 'string' &&
  typeof (value as ReferralParam).value === 'string';

const toRule = ({
  showOnPages,
  newsletterParams,
  stages,
  ...rule
}: StoredRule): EngagementRuleWithStages => ({
  ...rule,
  showOnPageIds: showOnPages.map(({ id }) => id),
  newsletterParams:
    Array.isArray(newsletterParams) ?
      newsletterParams.filter(isReferralParam)
    : [],
  stages: stages.map(stage => ({
    ...stage,
    description: stage.description as RichtextJSONDocument | null,
  })),
});

const ACTIVE_RULES_KEY = 'active';

const stageData = ({
  actions,
  description,
  ...stage
}: EngagementStageInput) => ({
  ...stage,
  // A hard stage is the cutoff, there is nothing to dismiss.
  dismissible:
    stage.enforcement === EngagementEnforcement.HARD ?
      false
    : stage.dismissible,
  description: (description ?? Prisma.DbNull) as Prisma.InputJsonValue,
  actions: { create: actions },
});

/**
 * The only code that touches `prisma.engagementRule`. Validates every write
 * and keeps the active rules in `content:engagement`, which the website layout
 * and anonymous answers are versioned by.
 */
@Injectable()
export class EngagementRuleService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  async getRules() {
    const rules = await this.prisma.engagementRule.findMany({
      include,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return rules.map(toRule);
  }

  async getRule(id: string) {
    const rule = await this.prisma.engagementRule.findUnique({
      where: { id },
      include,
    });

    return rule ? toRule(rule) : null;
  }

  getActiveRules(): Promise<EngagementRuleWithStages[]> {
    return this.kv.getOrLoadNs(
      contentCacheNamespace('engagement'),
      ACTIVE_RULES_KEY,
      async () =>
        (
          await this.prisma.engagementRule.findMany({
            where: { active: true },
            include,
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          })
        ).map(toRule),
      CONTENT_CACHE_TTL_SECONDS
    );
  }

  async create({
    stages,
    showOnPageIds,
    newsletterParams,
    ...rule
  }: CreateEngagementRuleInput) {
    this.validate({ ...rule, stages });

    const created = await this.prisma.engagementRule.create({
      data: {
        ...rule,
        newsletterParams: newsletterParams.map(({ key, value }) => ({
          key,
          value,
        })),
        showOnPages: { connect: showOnPageIds.map(id => ({ id })) },
        stages: { create: stages.map(stageData) },
      },
      include,
    });

    await this.forgetRules();

    return toRule(created);
  }

  async update({
    id,
    stages,
    showOnPageIds,
    newsletterParams,
    ...rule
  }: UpdateEngagementRuleInput) {
    this.validate({ ...rule, stages });

    const updated = await this.prisma.$transaction(async prisma => {
      await prisma.engagementStage.deleteMany({ where: { ruleId: id } });

      return prisma.engagementRule.update({
        where: { id },
        data: {
          ...rule,
          version: { increment: 1 },
          newsletterParams: newsletterParams.map(({ key, value }) => ({
            key,
            value,
          })),
          showOnPages: { set: showOnPageIds.map(pageId => ({ id: pageId })) },
          stages: { create: stages.map(stageData) },
        },
        include,
      });
    });

    await this.forgetRules();

    return toRule(updated);
  }

  async delete(id: string) {
    const deleted = await this.prisma.engagementRule.delete({
      where: { id },
      include,
    });

    await this.forgetRules();

    return toRule(deleted);
  }

  private validate(rule: Parameters<typeof validateEngagementRule>[0]) {
    const problems = validateEngagementRule(rule);

    if (problems.length) {
      throw new BadRequestException({
        message: `Invalid engagement rule: ${problems
          .map(({ path, code }) => `${path} ${code}`)
          .join(', ')}`,
        problems,
      });
    }
  }

  private async forgetRules() {
    // Article answers depend on the rules, blocks are cut by them. Resetting
    // content:engagement also rebuilds every website page (website layout).
    await this.publicContentCache.invalidate('engagement', 'articles');
  }
}
