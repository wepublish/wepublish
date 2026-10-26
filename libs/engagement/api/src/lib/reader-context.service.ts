import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { NewsletterVerifier } from './newsletter-verifier';
import { ReaderContext, readerContextFrom } from './reader-context';

export type ReaderRequest = { headers?: Record<string, unknown> };

@Injectable()
export class ReaderContextService {
  private readers = new WeakMap<object, Promise<ReaderContext>>();

  constructor(
    private prisma: PrismaClient,
    private newsletterVerifier: NewsletterVerifier
  ) {}

  /** The reader of a request, looked up once per request. */
  forRequest(
    req: ReaderRequest,
    session: AuthSession | null | undefined
  ): Promise<ReaderContext> {
    const known = this.readers.get(req);

    if (known) {
      return known;
    }

    const reader = this.load(req, session);
    this.readers.set(req, reader);

    return reader;
  }

  async isPaywallBypassToken(token: string | null | undefined) {
    if (!token) {
      return false;
    }

    return (
      (await this.prisma.paywallBypass.count({
        where: { token, paywall: { active: true } },
      })) > 0
    );
  }

  private async load(
    req: ReaderRequest,
    session: AuthSession | null | undefined
  ): Promise<ReaderContext> {
    const previewHeader = !!req.headers?.['preview'];

    if (session?.type !== AuthSessionType.User) {
      return readerContextFrom({ session, previewHeader });
    }

    const [subscriptions, newsletter] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userID: session.user.id },
        select: {
          memberPlanID: true,
          monthlyAmount: true,
          startsAt: true,
          paidUntil: true,
          paymentMethod: { select: { gracePeriod: true } },
        },
      }),
      this.newsletterVerifier.status({ userId: session.user.id }),
    ]);

    return readerContextFrom({
      session,
      previewHeader,
      newsletter,
      subscriptions: subscriptions.map(subscription => ({
        memberPlanId: subscription.memberPlanID,
        monthlyAmount: subscription.monthlyAmount,
        startsAt: subscription.startsAt,
        paidUntil: subscription.paidUntil,
        gracePeriod: subscription.paymentMethod.gracePeriod,
      })),
    });
  }
}
