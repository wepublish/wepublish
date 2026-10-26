import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType, UserSession } from '@wepublish/authentication/api';
import { ReaderContextService } from './reader-context.service';
import {
  NewsletterVerifier,
  UnavailableNewsletterVerifier,
} from './newsletter-verifier';

const session = {
  type: AuthSessionType.User,
  id: 'session',
  user: { id: 'user-1' },
  roles: [],
} as unknown as UserSession;

describe('ReaderContextService', () => {
  let prisma: {
    subscription: { findMany: Mock };
    paywallBypass: { count: Mock };
  };
  let service: ReaderContextService;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26'));
  });
  afterAll(() => vi.useRealTimers());

  beforeEach(() => {
    prisma = {
      subscription: {
        findMany: vi.fn().mockResolvedValue([
          {
            memberPlanID: 'plan-1',
            monthlyAmount: 0,
            startsAt: new Date('2026-01-01'),
            paidUntil: new Date('2027-01-01'),
            paymentMethod: { gracePeriod: 0 },
          },
        ]),
      },
      paywallBypass: { count: vi.fn().mockResolvedValue(0) },
    };
    service = new ReaderContextService(
      prisma as unknown as PrismaClient,
      new UnavailableNewsletterVerifier()
    );
  });

  it("builds the reader from the session and the reader's subscriptions", async () => {
    expect(await service.forRequest({ headers: {} }, session)).toMatchObject({
      kind: 'user',
      userId: 'user-1',
      activeMemberPlanIds: ['plan-1'],
      paying: false,
      newsletter: 'unknown',
    });
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userID: 'user-1' } })
    );
  });

  it('looks the reader up once per request', async () => {
    const req = { headers: {} };

    await service.forRequest(req, session);
    await service.forRequest(req, session);
    await service.forRequest({ headers: {} }, session);

    expect(prisma.subscription.findMany).toHaveBeenCalledTimes(2);
  });

  it('does not look up subscriptions of anonymous readers', async () => {
    expect(await service.forRequest({ headers: {} }, undefined)).toMatchObject({
      kind: 'anonymous',
    });
    expect(prisma.subscription.findMany).not.toHaveBeenCalled();
  });

  it('asks the newsletter verifier', async () => {
    const verifier: NewsletterVerifier = {
      status: vi.fn().mockResolvedValue('subscribed'),
    };

    service = new ReaderContextService(
      prisma as unknown as PrismaClient,
      verifier
    );

    expect(await service.forRequest({ headers: {} }, session)).toMatchObject({
      newsletter: 'subscribed',
    });
  });

  it('only accepts bypass tokens of active paywalls', async () => {
    expect(await service.isPaywallBypassToken(undefined)).toBe(false);
    expect(prisma.paywallBypass.count).not.toHaveBeenCalled();

    prisma.paywallBypass.count.mockResolvedValue(1);

    expect(await service.isPaywallBypassToken('token')).toBe(true);
    expect(prisma.paywallBypass.count).toHaveBeenCalledWith({
      where: { token: 'token', paywall: { active: true } },
    });
  });
});
