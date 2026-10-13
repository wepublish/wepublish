import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Gate,
  GateAction,
  GateActionRole,
  GateMode,
  LoginStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { findIndex, sortBy } from 'ramda';
import { audienceRanking } from './audience';
import {
  BannerDocumentType,
  CreateGateInput,
  GateActionInput,
  GateInputBase,
  GatesArgs,
  PrimaryBannerQuery,
  UpdateGateInput,
} from './gate.model';

export type GateWithActions = Gate & { actions: GateAction[] };

const INCLUDE = { actions: true } as const;

const COUNT_FIELDS = [
  'freeArticles',
  'softGateArticles',
  'previewBlocks',
  'newsletterFreeArticles',
  'meterWindowDays',
] as const;

const CONTENT_GATE_AUDIENCES: LoginStatus[] = [
  LoginStatus.LOGGED_OUT,
  LoginStatus.UNSUBSCRIBED,
];

const DEFAULTS: Record<GateMode, Partial<Prisma.GateCreateInput>> = {
  [GateMode.PAYWALL]: {
    active: true,
    audience: LoginStatus.UNSUBSCRIBED,
    anyMemberPlan: false,
    previewBlocks: 3,
    fadeout: true,
  },
  [GateMode.CONTENT_GATE]: {
    active: false,
    audience: LoginStatus.LOGGED_OUT,
    showOnArticles: true,
    previewBlocks: 3,
    freeArticles: 3,
    softGateArticles: 2,
    newsletterParams: [{ key: 'utm_medium', value: 'email' }],
    newsletterNeverGate: false,
    newsletterFreeArticles: 0,
  },
  [GateMode.BANNER]: {
    active: true,
    audience: LoginStatus.ALL,
    showOnArticles: true,
    collapsible: true,
    hideForMinutes: 1440,
    delay: 0,
  },
};

const validate = (mode: GateMode, input: GateInputBase) => {
  for (const field of COUNT_FIELDS) {
    const value = input[field];

    if (value != null && value < 0) {
      throw new BadRequestException(`${field} can not be lower than 0`);
    }
  }

  if (
    mode === GateMode.CONTENT_GATE &&
    input.audience &&
    !CONTENT_GATE_AUDIENCES.includes(input.audience)
  ) {
    throw new BadRequestException(
      `A content gate is for ${CONTENT_GATE_AUDIENCES.join(' or ')} readers`
    );
  }
};

const toAction = ({ label, url, style, role }: GateActionInput) => ({
  label,
  url,
  style: style ?? '',
  role: role ?? GateActionRole.OTHER,
});

const toData = ({
  memberPlanIds,
  bypassTokens,
  showOnPageIds,
  actions,
  imageId,
  description,
  upgradeDescription,
  circumventDescription,
  upgradeCircumventDescription,
  softDescription,
  newsletterParams,
  ...input
}: GateInputBase) => ({
  ...input,
  ...(imageId !== undefined && {
    image: imageId ? { connect: { id: imageId } } : { disconnect: true },
  }),
  ...(description !== undefined && {
    description: description as Prisma.InputJsonValue,
  }),
  ...(upgradeDescription !== undefined && {
    upgradeDescription: upgradeDescription as Prisma.InputJsonValue,
  }),
  ...(circumventDescription !== undefined && {
    circumventDescription: circumventDescription as Prisma.InputJsonValue,
  }),
  ...(upgradeCircumventDescription !== undefined && {
    upgradeCircumventDescription:
      upgradeCircumventDescription as Prisma.InputJsonValue,
  }),
  ...(softDescription !== undefined && {
    softDescription: softDescription as Prisma.InputJsonValue,
  }),
  ...(newsletterParams && {
    newsletterParams: newsletterParams.map(({ key, value }) => ({
      key,
      value,
    })),
  }),
});

/**
 * The only owner of Prisma access to gates: paywalls, content gates and
 * banners. The paywall, banner and content gate libs are facades over it.
 */
@Injectable()
export class GateService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  public getGates({ mode, skip, take }: GatesArgs) {
    return this.prisma.gate.findMany({
      where: { mode },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: INCLUDE,
    });
  }

  public getGate(id: string) {
    return this.prisma.gate.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  public getBypasses(gateId: string) {
    return this.prisma.gateBypass.findMany({
      where: { gateId },
    });
  }

  public async getPages(id: string) {
    const gate = await this.prisma.gate.findUnique({
      where: { id },
      select: { showOnPages: true },
    });

    return gate?.showOnPages ?? [];
  }

  public getActiveContentGate(): Promise<GateWithActions | null> {
    return this.kv.getOrLoadNs(
      contentCacheNamespace('gates'),
      'active-content-gate',
      () =>
        this.prisma.gate.findFirst({
          where: { mode: GateMode.CONTENT_GATE, active: true },
          include: INCLUDE,
        }),
      CONTENT_CACHE_TTL_SECONDS
    );
  }

  public async findPrimaryBanner(
    args: PrimaryBannerQuery
  ): Promise<GateWithActions | undefined> {
    const { banner } = await this.kv.getOrLoadNs(
      contentCacheNamespace('gates'),
      `primary-banner:${JSON.stringify(args)}`,
      async () => ({ banner: (await this.loadPrimaryBanner(args)) ?? null }),
      CONTENT_CACHE_TTL_SECONDS
    );

    return banner ?? undefined;
  }

  private async loadPrimaryBanner({
    documentType,
    documentId,
    ...reader
  }: PrimaryBannerQuery) {
    const ranking = audienceRanking(reader);
    let where: Prisma.GateWhereInput;

    if (documentType === BannerDocumentType.ARTICLE) {
      where = { showOnArticles: true };
    } else if (documentType === BannerDocumentType.PAGE) {
      where = { showOnPages: { some: { id: documentId } } };
    } else {
      return undefined;
    }

    const banners = await this.prisma.gate.findMany({
      where: {
        mode: GateMode.BANNER,
        active: true,
        ...where,
        audience: { in: ranking },
      },
      include: INCLUDE,
    });

    const byFittingAudience = sortBy<GateWithActions>(({ audience }) => {
      const index = findIndex(status => status === audience, ranking);

      return index === -1 ? ranking.length : index;
    });

    return byFittingAudience(banners).at(0);
  }

  public async assertPaywall(id: string) {
    const gate = await this.prisma.gate.findUnique({
      where: { id },
      select: { mode: true },
    });

    if (gate?.mode !== GateMode.PAYWALL) {
      throw new BadRequestException(`${id} is not a paywall`);
    }
  }

  public async createGate({
    mode,
    actions,
    showOnPageIds,
    memberPlanIds,
    bypassTokens,
    ...input
  }: CreateGateInput) {
    validate(mode, input);

    const result = await this.prisma.$transaction(async prisma => {
      if (mode === GateMode.CONTENT_GATE && input.active) {
        await prisma.gate.updateMany({
          where: { mode, active: true },
          data: { active: false },
        });
      }

      return prisma.gate.create({
        data: {
          ...DEFAULTS[mode],
          ...toData(input),
          mode,
          actions: actions && { create: actions.map(toAction) },
          showOnPages: showOnPageIds && {
            connect: showOnPageIds.map(id => ({ id })),
          },
          memberPlans: memberPlanIds && {
            createMany: {
              data: memberPlanIds.map(memberPlanId => ({ memberPlanId })),
            },
          },
          bypasses: bypassTokens && {
            createMany: { data: bypassTokens.map(token => ({ token })) },
          },
        } as Prisma.GateCreateInput,
        include: INCLUDE,
      });
    });
    await this.publicContentCache.invalidate('gates', 'articles');

    return result;
  }

  public async updateGate({
    id,
    actions,
    showOnPageIds,
    memberPlanIds,
    bypassTokens,
    ...input
  }: UpdateGateInput) {
    const existing = await this.prisma.gate.findUnique({
      where: { id },
      select: { mode: true },
    });

    if (!existing) {
      throw new NotFoundException(`Gate with id ${id} was not found.`);
    }

    validate(existing.mode, input);

    const result = await this.prisma.$transaction(async prisma => {
      if (existing.mode === GateMode.CONTENT_GATE && input.active) {
        await prisma.gate.updateMany({
          where: { mode: existing.mode, active: true, id: { not: id } },
          data: { active: false },
        });
      }

      return prisma.gate.update({
        where: { id },
        data: {
          ...toData(input),
          ...(actions && {
            actions: { deleteMany: {}, create: actions.map(toAction) },
          }),
          ...(showOnPageIds && {
            showOnPages: { set: showOnPageIds.map(id => ({ id })) },
          }),
          ...(memberPlanIds && {
            memberPlans: {
              deleteMany: { memberPlanId: { notIn: memberPlanIds } },
              createMany: {
                skipDuplicates: true,
                data: memberPlanIds.map(memberPlanId => ({ memberPlanId })),
              },
            },
          }),
          ...(bypassTokens && {
            bypasses: {
              deleteMany: { token: { notIn: bypassTokens } },
              createMany: {
                skipDuplicates: true,
                data: bypassTokens.map(token => ({ token })),
              },
            },
          }),
        },
        include: INCLUDE,
      });
    });
    await this.publicContentCache.invalidate('gates', 'articles');

    return result;
  }

  public async deleteGate(id: string) {
    const result = await this.prisma.gate.delete({
      where: { id },
      include: INCLUDE,
    });
    await this.publicContentCache.invalidate('gates', 'articles');

    return result;
  }
}
