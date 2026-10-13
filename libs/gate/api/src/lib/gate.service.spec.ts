import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GateActionRole, GateMode, LoginStatus } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { BannerDocumentType } from './gate.model';
import { GateService } from './gate.service';

describe('GateService', () => {
  let kv: KvTtlCacheService;
  const publicContentCache = { invalidate: vi.fn() };
  const prisma = {
    gate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    gateBypass: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };

  const service = () =>
    new GateService(prisma as any, kv, publicContentCache as any);

  const gateWithMode = (mode: GateMode) => ({ id: 'gate-1', mode });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);

    for (const fn of Object.values(prisma.gate)) {
      fn.mockReset().mockResolvedValue(gateWithMode(GateMode.PAYWALL));
    }

    prisma.gateBypass.findMany.mockReset().mockResolvedValue([]);
    prisma.$transaction
      .mockReset()
      .mockImplementation(async (run: any) => run(prisma));
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
  });

  describe('reading', () => {
    it('lists the gates of one mode, oldest first, with their actions', async () => {
      prisma.gate.findMany.mockResolvedValue([{ id: 'gate-1' }]);

      expect(
        await service().getGates({ mode: GateMode.BANNER, skip: 10, take: 5 })
      ).toEqual([{ id: 'gate-1' }]);
      expect(prisma.gate.findMany).toHaveBeenCalledWith({
        where: { mode: GateMode.BANNER },
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'asc' },
        include: { actions: true },
      });
    });

    it('loads one gate with its actions', async () => {
      await service().getGate('gate-1');

      expect(prisma.gate.findUnique).toHaveBeenCalledWith({
        where: { id: 'gate-1' },
        include: { actions: true },
      });
    });

    it('loads the bypasses of a gate', async () => {
      prisma.gateBypass.findMany.mockResolvedValue([{ token: 'abc' }]);

      expect(await service().getBypasses('gate-1')).toEqual([{ token: 'abc' }]);
      expect(prisma.gateBypass.findMany).toHaveBeenCalledWith({
        where: { gateId: 'gate-1' },
      });
    });

    it('loads the pages a banner shows on', async () => {
      prisma.gate.findUnique.mockResolvedValue({
        showOnPages: [{ id: 'page-1' }],
      });

      expect(await service().getPages('gate-1')).toEqual([{ id: 'page-1' }]);
    });

    it('answers no pages for a gate that does not exist', async () => {
      prisma.gate.findUnique.mockResolvedValue(null);

      expect(await service().getPages('gate-1')).toEqual([]);
    });
  });

  describe('creating', () => {
    const created = () => prisma.gate.create.mock.calls[0][0].data;

    it('gives a paywall the paywall defaults', async () => {
      await service().createGate({ mode: GateMode.PAYWALL, name: 'Premium' });

      expect(created()).toMatchObject({
        mode: GateMode.PAYWALL,
        name: 'Premium',
        active: true,
        audience: LoginStatus.UNSUBSCRIBED,
        anyMemberPlan: false,
        previewBlocks: 3,
        fadeout: true,
      });
    });

    it('gives a content gate the content gate defaults', async () => {
      await service().createGate({ mode: GateMode.CONTENT_GATE, name: 'Wall' });

      expect(created()).toMatchObject({
        mode: GateMode.CONTENT_GATE,
        active: false,
        audience: LoginStatus.LOGGED_OUT,
        showOnArticles: true,
        previewBlocks: 3,
        freeArticles: 3,
        softGateArticles: 2,
        newsletterFreeArticles: 0,
        newsletterNeverGate: false,
        newsletterParams: [{ key: 'utm_medium', value: 'email' }],
      });
    });

    it('gives a banner the banner defaults', async () => {
      await service().createGate({ mode: GateMode.BANNER, title: 'Hi' });

      expect(created()).toMatchObject({
        mode: GateMode.BANNER,
        title: 'Hi',
        active: true,
        audience: LoginStatus.ALL,
        showOnArticles: true,
        collapsible: true,
        hideForMinutes: 1440,
        delay: 0,
      });
    });

    it('prefers what was given over the defaults', async () => {
      await service().createGate({
        mode: GateMode.PAYWALL,
        active: false,
        previewBlocks: 0,
        fadeout: false,
      });

      expect(created()).toMatchObject({
        active: false,
        previewBlocks: 0,
        fadeout: false,
      });
    });

    it('creates the actions, pages, member plans and bypasses with the gate', async () => {
      await service().createGate({
        mode: GateMode.PAYWALL,
        actions: [{ label: 'Abo', url: 'https://abo', role: 'PRIMARY' }],
        showOnPageIds: ['page-1'],
        memberPlanIds: ['plan-1'],
        bypassTokens: ['token-1'],
      });

      expect(created()).toMatchObject({
        actions: {
          create: [
            {
              label: 'Abo',
              url: 'https://abo',
              style: '',
              role: GateActionRole.PRIMARY,
            },
          ],
        },
        showOnPages: { connect: [{ id: 'page-1' }] },
        memberPlans: {
          createMany: { data: [{ memberPlanId: 'plan-1' }] },
        },
        bypasses: { createMany: { data: [{ token: 'token-1' }] } },
      });
      expect(created()).not.toHaveProperty('memberPlanIds');
      expect(created()).not.toHaveProperty('bypassTokens');
      expect(created()).not.toHaveProperty('showOnPageIds');
    });

    it('returns the gate with its actions', async () => {
      await service().createGate({ mode: GateMode.BANNER });

      expect(prisma.gate.create.mock.calls[0][0].include).toEqual({
        actions: true,
      });
    });
  });

  describe('updating', () => {
    const updated = () => prisma.gate.update.mock.calls[0][0];

    it('replaces the actions and pages when they are given', async () => {
      await service().updateGate({
        id: 'gate-1',
        actions: [{ label: 'Later', url: '#', role: GateActionRole.CANCEL }],
        showOnPageIds: ['page-2'],
      });

      expect(updated()).toMatchObject({
        where: { id: 'gate-1' },
        data: {
          actions: {
            deleteMany: {},
            create: [
              {
                label: 'Later',
                url: '#',
                style: '',
                role: GateActionRole.CANCEL,
              },
            ],
          },
          showOnPages: { set: [{ id: 'page-2' }] },
        },
        include: { actions: true },
      });
    });

    it('syncs the member plans and bypasses when they are given', async () => {
      await service().updateGate({
        id: 'gate-1',
        memberPlanIds: ['plan-1'],
        bypassTokens: ['token-1'],
      });

      expect(updated().data).toMatchObject({
        memberPlans: {
          deleteMany: { memberPlanId: { notIn: ['plan-1'] } },
          createMany: {
            skipDuplicates: true,
            data: [{ memberPlanId: 'plan-1' }],
          },
        },
        bypasses: {
          deleteMany: { token: { notIn: ['token-1'] } },
          createMany: { skipDuplicates: true, data: [{ token: 'token-1' }] },
        },
      });
    });

    it('leaves relations alone that were not given', async () => {
      await service().updateGate({ id: 'gate-1', name: 'Renamed' });

      expect(updated().data).toEqual({ name: 'Renamed' });
    });

    it('fails for a gate that does not exist', async () => {
      prisma.gate.findUnique.mockResolvedValue(null);

      await expect(
        service().updateGate({ id: 'missing', name: 'x' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validation', () => {
    it.each([
      'freeArticles',
      'softGateArticles',
      'previewBlocks',
      'newsletterFreeArticles',
      'meterWindowDays',
    ])('rejects a negative %s', async field => {
      await expect(
        service().createGate({ mode: GateMode.CONTENT_GATE, [field]: -1 })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service().updateGate({ id: 'gate-1', [field]: -1 })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.gate.create).not.toHaveBeenCalled();
      expect(prisma.gate.update).not.toHaveBeenCalled();
    });

    it.each([
      LoginStatus.ALL,
      LoginStatus.LOGGED_IN,
      LoginStatus.SUBSCRIBED,
      LoginStatus.PAYWALL_BYPASSED,
    ])('rejects a content gate for %s', async audience => {
      prisma.gate.findUnique.mockResolvedValue(
        gateWithMode(GateMode.CONTENT_GATE)
      );

      await expect(
        service().createGate({ mode: GateMode.CONTENT_GATE, audience })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service().updateGate({ id: 'gate-1', audience })
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts any audience for a banner', async () => {
      await service().createGate({
        mode: GateMode.BANNER,
        audience: LoginStatus.PAYWALL_BYPASSED,
      });

      expect(prisma.gate.create).toHaveBeenCalled();
    });

    describe('assertPaywall', () => {
      it('accepts a paywall', async () => {
        prisma.gate.findUnique.mockResolvedValue(
          gateWithMode(GateMode.PAYWALL)
        );

        await expect(service().assertPaywall('gate-1')).resolves.toBe(
          undefined
        );
        expect(prisma.gate.findUnique).toHaveBeenCalledWith({
          where: { id: 'gate-1' },
          select: { mode: true },
        });
      });

      it.each([GateMode.BANNER, GateMode.CONTENT_GATE])(
        'rejects a %s as an article paywall',
        async mode => {
          prisma.gate.findUnique.mockResolvedValue(gateWithMode(mode));

          await expect(service().assertPaywall('gate-1')).rejects.toThrow(
            BadRequestException
          );
        }
      );

      it('rejects a paywall that does not exist', async () => {
        prisma.gate.findUnique.mockResolvedValue(null);

        await expect(service().assertPaywall('gate-1')).rejects.toThrow(
          BadRequestException
        );
      });
    });
  });

  describe('a single active content gate', () => {
    beforeEach(() => {
      prisma.gate.findUnique.mockResolvedValue(
        gateWithMode(GateMode.CONTENT_GATE)
      );
    });

    it('deactivates every other content gate when one gets activated', async () => {
      await service().updateGate({ id: 'gate-1', active: true });

      expect(prisma.gate.updateMany).toHaveBeenCalledWith({
        where: {
          mode: GateMode.CONTENT_GATE,
          active: true,
          id: { not: 'gate-1' },
        },
        data: { active: false },
      });
      expect(prisma.gate.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.gate.update.mock.invocationCallOrder[0]
      );
    });

    it('deactivates every other content gate when an active one gets created', async () => {
      await service().createGate({ mode: GateMode.CONTENT_GATE, active: true });

      expect(prisma.gate.updateMany).toHaveBeenCalledWith({
        where: { mode: GateMode.CONTENT_GATE, active: true },
        data: { active: false },
      });
    });

    it('leaves other gates alone when an inactive gate changes', async () => {
      await service().updateGate({ id: 'gate-1', name: 'Renamed' });

      expect(prisma.gate.updateMany).not.toHaveBeenCalled();
    });

    it('lets several paywalls be active', async () => {
      prisma.gate.findUnique.mockResolvedValue(gateWithMode(GateMode.PAYWALL));

      await service().updateGate({ id: 'gate-1', active: true });
      await service().createGate({ mode: GateMode.PAYWALL, active: true });

      expect(prisma.gate.updateMany).not.toHaveBeenCalled();
    });

    it('loads the active content gate once across requests', async () => {
      prisma.gate.findFirst.mockResolvedValue({ id: 'gate-1' });

      expect(await service().getActiveContentGate()).toEqual({ id: 'gate-1' });
      expect(await service().getActiveContentGate()).toEqual({ id: 'gate-1' });
      expect(prisma.gate.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.gate.findFirst).toHaveBeenCalledWith({
        where: { mode: GateMode.CONTENT_GATE, active: true },
        include: { actions: true },
      });
    });

    it('loads the active content gate again once gates changed', async () => {
      await service().getActiveContentGate();
      await new PublicContentCacheInvalidator(kv).invalidateDraft('gates');
      await service().getActiveContentGate();

      expect(prisma.gate.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache invalidation', () => {
    it.each<[string, () => Promise<unknown>]>([
      ['creating', () => service().createGate({ mode: GateMode.BANNER })],
      ['updating', () => service().updateGate({ id: 'gate-1' })],
      ['deleting', () => service().deleteGate('gate-1')],
    ])(
      'clears cached gates and articles after %s a gate, since article blocks and paywall ids depend on them',
      async (_, change) => {
        await change();

        expect(publicContentCache.invalidate).toHaveBeenCalledWith(
          'gates',
          'articles'
        );
      }
    );

    it('returns the deleted gate', async () => {
      prisma.gate.delete.mockResolvedValue({ id: 'gate-1', name: 'Gone' });

      expect(await service().deleteGate('gate-1')).toEqual({
        id: 'gate-1',
        name: 'Gone',
      });
    });
  });

  describe('findPrimaryBanner', () => {
    const banner = (audience: LoginStatus) => ({
      id: audience,
      mode: GateMode.BANNER,
      audience,
    });
    const banners = [
      LoginStatus.ALL,
      LoginStatus.LOGGED_IN,
      LoginStatus.LOGGED_OUT,
      LoginStatus.SUBSCRIBED,
      LoginStatus.UNSUBSCRIBED,
      LoginStatus.PAYWALL_BYPASSED,
    ].map(banner);

    const anonymous = {
      loggedIn: false,
      hasSubscription: false,
      hasPaywallBypass: false,
    };
    const loggedIn = { ...anonymous, loggedIn: true };
    const bypassingSubscriber = {
      loggedIn: true,
      hasSubscription: true,
      hasPaywallBypass: true,
    };

    beforeEach(() => {
      prisma.gate.findMany.mockResolvedValue(banners);
    });

    it.each<[BannerDocumentType, typeof anonymous, LoginStatus, LoginStatus[]]>(
      [
        [
          BannerDocumentType.ARTICLE,
          anonymous,
          LoginStatus.LOGGED_OUT,
          [LoginStatus.LOGGED_OUT, LoginStatus.UNSUBSCRIBED, LoginStatus.ALL],
        ],
        [
          BannerDocumentType.ARTICLE,
          loggedIn,
          LoginStatus.UNSUBSCRIBED,
          [LoginStatus.UNSUBSCRIBED, LoginStatus.LOGGED_IN, LoginStatus.ALL],
        ],
        [
          BannerDocumentType.ARTICLE,
          bypassingSubscriber,
          LoginStatus.PAYWALL_BYPASSED,
          [
            LoginStatus.PAYWALL_BYPASSED,
            LoginStatus.SUBSCRIBED,
            LoginStatus.LOGGED_IN,
            LoginStatus.ALL,
          ],
        ],
        [
          BannerDocumentType.PAGE,
          anonymous,
          LoginStatus.LOGGED_OUT,
          [LoginStatus.LOGGED_OUT, LoginStatus.UNSUBSCRIBED, LoginStatus.ALL],
        ],
        [
          BannerDocumentType.PAGE,
          loggedIn,
          LoginStatus.UNSUBSCRIBED,
          [LoginStatus.UNSUBSCRIBED, LoginStatus.LOGGED_IN, LoginStatus.ALL],
        ],
        [
          BannerDocumentType.PAGE,
          bypassingSubscriber,
          LoginStatus.PAYWALL_BYPASSED,
          [
            LoginStatus.PAYWALL_BYPASSED,
            LoginStatus.SUBSCRIBED,
            LoginStatus.LOGGED_IN,
            LoginStatus.ALL,
          ],
        ],
      ]
    )(
      'picks the best fitting banner of document type %s for %o',
      async (documentType, reader, picked, audiences) => {
        const result = await service().findPrimaryBanner({
          documentType,
          documentId: '1',
          ...reader,
        });

        expect(result?.audience).toBe(picked);
        expect(prisma.gate.findMany).toHaveBeenCalledWith({
          where: {
            mode: GateMode.BANNER,
            active: true,
            ...(documentType === BannerDocumentType.ARTICLE ?
              { showOnArticles: true }
            : { showOnPages: { some: { id: '1' } } }),
            audience: { in: audiences },
          },
          include: { actions: true },
        });
      }
    );

    it('answers nothing when no banner fits', async () => {
      prisma.gate.findMany.mockResolvedValue([]);

      expect(
        await service().findPrimaryBanner({
          documentType: BannerDocumentType.ARTICLE,
          documentId: '1',
          ...loggedIn,
        })
      ).toBeFalsy();
    });

    it('does not look for banners of unknown document types', async () => {
      expect(
        await service().findPrimaryBanner({
          documentType: 'INVALID' as unknown as BannerDocumentType,
          documentId: '1',
          ...loggedIn,
        })
      ).toBeFalsy();
      expect(prisma.gate.findMany).not.toHaveBeenCalled();
    });

    describe('cache', () => {
      const args = {
        documentType: BannerDocumentType.ARTICLE,
        documentId: 'article-1',
        ...anonymous,
      };

      it('serves the primary banner from the cache', async () => {
        await service().findPrimaryBanner(args);
        const second = await service().findPrimaryBanner(args);

        expect(prisma.gate.findMany).toHaveBeenCalledTimes(1);
        expect(second?.id).toBe(LoginStatus.LOGGED_OUT);
      });

      it('remembers that there is no banner', async () => {
        prisma.gate.findMany.mockResolvedValue([]);

        await service().findPrimaryBanner(args);
        const second = await service().findPrimaryBanner(args);

        expect(prisma.gate.findMany).toHaveBeenCalledTimes(1);
        expect(second).toBeUndefined();
      });

      it('caches the primary banner per audience', async () => {
        await service().findPrimaryBanner(args);
        await service().findPrimaryBanner({ ...args, loggedIn: true });

        expect(prisma.gate.findMany).toHaveBeenCalledTimes(2);
      });

      it('loads the primary banner again after gates changed', async () => {
        await service().findPrimaryBanner(args);
        await new PublicContentCacheInvalidator(kv).invalidateDraft('gates');
        await service().findPrimaryBanner(args);

        expect(prisma.gate.findMany).toHaveBeenCalledTimes(2);
      });
    });
  });
});
