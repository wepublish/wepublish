import { LoginStatus } from '@prisma/client';
import { AuthSessionType } from '@wepublish/authentication/api';
import { ContentGateAccessService } from './content-gate-access.service';

describe('ContentGateAccessService', () => {
  const prisma = { subscription: { findMany: vi.fn() } };
  const gateService = { getActiveContentGate: vi.fn() };
  const service = () =>
    new ContentGateAccessService(prisma as any, gateService as any);

  const article = { paywallId: null, contentGateDisabled: false };
  const session = {
    type: AuthSessionType.User,
    user: { id: 'user-1' },
    roles: [],
  } as any;
  const day = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    prisma.subscription.findMany.mockReset().mockResolvedValue([]);
    gateService.getActiveContentGate.mockReset().mockResolvedValue({
      id: 'gate-1',
      active: true,
      audience: LoginStatus.UNSUBSCRIBED,
      previewBlocks: 2,
    });
  });

  it('returns the gate for readers it applies to', async () => {
    expect(await service().gateFor(article, undefined)).toMatchObject({
      id: 'gate-1',
    });
  });

  it('returns no gate for readers it does not apply to', async () => {
    expect(
      await service().gateFor({ ...article, contentGateDisabled: true }, null)
    ).toBeNull();
  });

  it('counts a paid subscription as active', async () => {
    prisma.subscription.findMany.mockResolvedValue([
      {
        startsAt: new Date(Date.now() - day),
        paidUntil: new Date(Date.now() + day),
        paymentMethod: { gracePeriod: 0 },
      },
    ]);

    expect(await service().gateFor(article, session)).toBeNull();
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userID: 'user-1' }),
      })
    );
  });

  it('does not count an expired subscription', async () => {
    prisma.subscription.findMany.mockResolvedValue([
      {
        startsAt: new Date(Date.now() - 30 * day),
        paidUntil: new Date(Date.now() - day),
        paymentMethod: { gracePeriod: 0 },
      },
    ]);

    expect(await service().gateFor(article, session)).not.toBeNull();
  });

  describe('previewBlocks', () => {
    const blocks = ['a', 'b', 'c', 'd'];

    it('cuts the blocks of gated articles down to the preview', async () => {
      expect(await service().previewBlocks(blocks, article, undefined)).toEqual(
        {
          blocks: ['a', 'b'],
          gated: true,
        }
      );
    });

    it('keeps every block when the gate does not apply', async () => {
      gateService.getActiveContentGate.mockResolvedValue(null);

      expect(await service().previewBlocks(blocks, article, undefined)).toEqual(
        {
          blocks,
          gated: false,
        }
      );
    });

    it('does not report short articles as gated when nothing was cut', async () => {
      expect(
        await service().previewBlocks(['a', 'b'], article, undefined)
      ).toEqual({ blocks: ['a', 'b'], gated: false });
    });
  });
});
