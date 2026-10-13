import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { GateService, GateWithActions } from '@wepublish/gate/api';
import { addDays } from 'date-fns';
import { ContentGateAccessInput, isContentGated } from './content-gate-access';

@Injectable()
export class ContentGateAccessService {
  constructor(
    private prisma: PrismaClient,
    private gateService: GateService
  ) {}

  /**
   * The active gate if it applies to this reader and article, otherwise null.
   */
  public async gateFor(
    article: ContentGateAccessInput['article'],
    session: AuthSession | null | undefined
  ): Promise<GateWithActions | null> {
    const gate = await this.gateService.getActiveContentGate();

    const gated = await isContentGated({
      gate,
      article,
      session,
      hasActiveSubscription: () => this.hasActiveSubscription(session),
    });

    return gated ? gate : null;
  }

  public async previewBlocks<T>(
    blocks: T[],
    article: ContentGateAccessInput['article'],
    session: AuthSession | null | undefined
  ): Promise<{ blocks: T[]; gated: boolean }> {
    const gate = await this.gateFor(article, session);

    const previewBlocks = gate?.previewBlocks ?? 0;

    if (!gate || blocks.length <= previewBlocks) {
      return { blocks, gated: false };
    }

    return { blocks: blocks.slice(0, previewBlocks), gated: true };
  }

  private async hasActiveSubscription(session: AuthSession | null | undefined) {
    if (session?.type !== AuthSessionType.User) {
      return false;
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userID: session.user.id,
        startsAt: { lte: new Date() },
      },
      select: {
        startsAt: true,
        paidUntil: true,
        paymentMethod: { select: { gracePeriod: true } },
      },
    });

    // Same rule as isActiveSubscription in @wepublish/membership/api,
    // which can not be imported here without an import cycle through article.
    const now = new Date();

    return subscriptions.some(
      ({ startsAt, paidUntil, paymentMethod: { gracePeriod } }) =>
        (paidUntil && now > startsAt && paidUntil > now) ||
        (!!gracePeriod && addDays(paidUntil ?? startsAt, gracePeriod) >= now)
    );
  }
}
