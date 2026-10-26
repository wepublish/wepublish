import { Injectable, NotFoundException } from '@nestjs/common';
import { Article } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import {
  EngagementRuleService,
  MeterService,
  ReaderContextService,
  ReaderRequest,
  ReferralParam,
  articleTarget,
  matchingRules,
  maxMeterWindowDays,
  meteredAccess,
  recordRead,
  resolvePrompts,
  toEngagementPrompt,
} from '@wepublish/engagement/api';
import {
  PaywallDataloaderService,
  PaywallMemberPlansDataloader,
  PaywallService,
} from '@wepublish/paywall/api';
import { ArticleDataloaderService } from './article-dataloader.service';
import {
  AccessPaywall,
  ArticleAccessResult,
  evaluateArticleAccess,
  isRestricted,
} from './article-access';

/**
 * `viewArticle` adds the articles it granted, so the `blocks` of the same
 * request (the article it returns) are not cut.
 */
export type ArticleRequest = ReaderRequest & { engagementGrants?: Set<string> };

const grant = (req: ArticleRequest, articleId: string) => {
  req.engagementGrants ??= new Set();
  req.engagementGrants.add(articleId);
};

/**
 * Decides whether a reader gets every block of an article. Request scoped
 * (through the dataloaders), so each article is decided once per request.
 */
@Injectable()
export class ArticleAccessService {
  private decisions = new Map<string, Promise<ArticleAccessResult>>();

  constructor(
    private articles: ArticleDataloaderService,
    private paywalls: PaywallDataloaderService,
    private paywallMemberPlans: PaywallMemberPlansDataloader,
    private paywallService: PaywallService,
    private readers: ReaderContextService,
    private rules: EngagementRuleService,
    private meters: MeterService
  ) {}

  /**
   * Access without a meter, for `ArticleRevision.blocks`: what ISR, RSS and
   * API consumers get. Only `viewArticle` places a reader on the meter.
   */
  accessFor(
    req: ArticleRequest,
    session: AuthSession | null | undefined,
    articleId: string
  ): Promise<ArticleAccessResult> {
    if (!articleId || req.engagementGrants?.has(articleId)) {
      return Promise.resolve({ granted: true });
    }

    const known = this.decisions.get(articleId);

    if (known) {
      return known;
    }

    const decision = this.decide(req, session, articleId);
    this.decisions.set(articleId, decision);

    return decision;
  }

  async view({
    req,
    session,
    articleId,
    meterToken,
    referral,
    paywallBypassToken,
  }: {
    req: ArticleRequest;
    session: AuthSession | null | undefined;
    articleId: string;
    meterToken?: string | null;
    referral?: ReferralParam[];
    paywallBypassToken?: string | null;
  }) {
    const article = await this.articles.load(articleId);

    if (!article) {
      throw new NotFoundException(
        `Article with id ${articleId} was not found.`
      );
    }

    const now = new Date();
    const [reader, paywall, rules, paywallBypassed] = await Promise.all([
      this.readers.forRequest(req, session),
      this.paywallOf(article, paywallBypassToken),
      this.rules.getActiveRules(),
      this.readers.isPaywallBypassToken(paywallBypassToken),
    ]);
    const matching = matchingRules(
      rules,
      { ...reader, paywallBypassed },
      articleTarget({ ...article, hasActivePaywall: !!paywall?.active })
    );
    const meter = await this.meters.load(reader, meterToken);
    const metered = meteredAccess({
      rules: matching,
      meter,
      articleId,
      referral,
      now,
    });
    const access = evaluateArticleAccess({
      reader,
      paywall,
      metered,
      bypassToken: paywallBypassToken,
    });
    const maxWindowDays = maxMeterWindowDays(rules);
    const read =
      access.granted && metered.granted && metered.record ?
        recordRead(meter, articleId, now, {
          maxWindowDays,
          referral: metered.referral,
        })
      : meter;

    if (access.granted) {
      grant(req, articleId);
    }

    return {
      article,
      access,
      // Logged-in meters are kept on the server, only written when they grew.
      meterToken:
        reader.privileged || (reader.userId && read === meter) ?
          null
        : await this.meters.save(reader, read, maxWindowDays),
      prompts: resolvePrompts({
        rules: matching,
        meter,
        articleId,
        now,
        restriction:
          isRestricted(access) && access.ruleId && access.stageId ?
            { ruleId: access.ruleId, stageId: access.stageId }
          : undefined,
      }).map(toEngagementPrompt),
    };
  }

  private async decide(
    req: ArticleRequest,
    session: AuthSession | null | undefined,
    articleId: string
  ): Promise<ArticleAccessResult> {
    const article = await this.articles.load(articleId);

    if (!article) {
      return { granted: true };
    }

    const reader = await this.readers.forRequest(req, session);

    if (reader.privileged) {
      return { granted: true };
    }

    const [paywall, rules] = await Promise.all([
      this.paywallOf(article),
      this.rules.getActiveRules(),
    ]);

    return evaluateArticleAccess({
      reader,
      paywall,
      metered: meteredAccess({
        rules: matchingRules(
          rules,
          reader,
          articleTarget({ ...article, hasActivePaywall: !!paywall?.active })
        ),
        articleId,
        now: new Date(),
      }),
    });
  }

  private async paywallOf(
    article: Pick<Article, 'paywallId'>,
    bypassToken?: string | null
  ): Promise<AccessPaywall | null> {
    const paywall =
      article.paywallId ? await this.paywalls.load(article.paywallId) : null;

    if (!paywall) {
      return null;
    }

    const needsMembers = paywall.active && paywall.enforced;
    const [memberPlans, bypasses] = await Promise.all([
      needsMembers ? this.paywallMemberPlans.load(paywall.id) : [],
      needsMembers && bypassToken ?
        this.paywallService.getPaywallBypasses(paywall.id)
      : [],
    ]);

    return {
      id: paywall.id,
      active: paywall.active,
      enforced: paywall.enforced,
      anyMemberPlan: paywall.anyMemberPlan,
      hideContentAfter: paywall.hideContentAfter,
      memberPlanIds: (memberPlans ?? []).map(({ id }) => id),
      bypassTokens: bypasses.map(({ token }) => token),
    };
  }
}
