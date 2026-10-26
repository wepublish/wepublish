import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PrismaClient } from '@prisma/client';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import {
  EngagementDocumentType,
  EngagementPrompt,
  EngagementPromptsArgs,
} from './engagement-rule.model';
import { EngagementRuleService } from './engagement-rule.service';
import {
  EngagementTarget,
  articleTarget,
  matchingRules,
  resolvePrompts,
} from './evaluate';
import { toEngagementPrompt } from './engagement-prompt';
import { ReaderContextService, ReaderRequest } from './reader-context.service';

@Resolver(() => EngagementPrompt)
export class EngagementPromptsResolver {
  constructor(
    private rules: EngagementRuleService,
    private readers: ReaderContextService,
    private prisma: PrismaClient
  ) {}

  @Public()
  @Query(() => [EngagementPrompt], {
    description: `The prompts for the reader on a page or article, without placing them on the meter: soft stages only, no cutoff. Articles use the viewArticle mutation, which meters and decides access.`,
  })
  async engagementPrompts(
    @Args()
    { documentType, documentId, paywallBypassToken }: EngagementPromptsArgs,
    @CurrentUser() session: AuthSession | undefined,
    @Context('req') req: ReaderRequest
  ) {
    const [reader, paywallBypassed, rules, target] = await Promise.all([
      this.readers.forRequest(req, session),
      this.readers.isPaywallBypassToken(paywallBypassToken),
      this.rules.getActiveRules(),
      this.targetOf(documentType, documentId),
    ]);

    if (!target) {
      return [];
    }

    return resolvePrompts({
      rules: matchingRules(rules, { ...reader, paywallBypassed }, target),
      now: new Date(),
    }).map(toEngagementPrompt);
  }

  private async targetOf(
    documentType: EngagementDocumentType,
    documentId: string
  ): Promise<EngagementTarget | null> {
    if (documentType === EngagementDocumentType.PAGE) {
      return { kind: 'page', pageId: documentId };
    }

    const article = await this.prisma.article.findUnique({
      where: { id: documentId },
      select: {
        contentGateDisabled: true,
        peerId: true,
        paywall: { select: { active: true } },
      },
    });

    return article ?
        articleTarget({
          id: documentId,
          contentGateDisabled: article.contentGateDisabled,
          peerId: article.peerId,
          hasActivePaywall: !!article.paywall?.active,
        })
      : null;
  }
}
