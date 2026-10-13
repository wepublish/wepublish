import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GateActionRole, GateMode, LoginStatus } from '@prisma/client';
import { GateService } from '@wepublish/gate/api';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { pick } from 'ramda';
import { BannerResolver } from './banner.resolver';
import { BannerDocumentType } from './banner.model';

// The scalar fields of the Banner GraphQL type.
const BANNER_FIELDS = [
  'id',
  'title',
  'text',
  'cta',
  'html',
  'embedUrl',
  'active',
  'collapsible',
  'delay',
  'hideForMinutes',
  'showOnArticles',
  'imageId',
  'showForLoginStatus',
] as const;

describe('BannerResolver', () => {
  let resolver: BannerResolver;

  const gate = {
    id: '1',
    createdAt: new Date('2023-01-01'),
    modifiedAt: new Date('2023-01-01'),
    mode: GateMode.BANNER,
    name: null,
    title: 'Test Banner',
    text: 'Test Banner Text',
    cta: null,
    imageId: null,
    active: true,
    delay: 0,
    html: null,
    embedUrl: null,
    showOnArticles: true,
    audience: LoginStatus.ALL,
    collapsible: true,
    hideForMinutes: 24 * 60,
    actions: [],
  };

  const prisma = {
    gate: { findMany: vi.fn(), findUnique: vi.fn() },
  };
  const imageDataloader = {
    load: vi.fn().mockReturnValue({ __typename: 'Image', id: '123' }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    const gateService = new GateService(
      prisma as any,
      module.get(KvTtlCacheService),
      { invalidate: vi.fn() } as any
    );

    resolver = new BannerResolver(gateService, imageDataloader as any);
  });

  describe('banners', () => {
    it('lists banner gates as banners', async () => {
      prisma.gate.findMany.mockResolvedValue([gate]);

      const result = await resolver.banners({ skip: 0, take: 10 });

      expect(result.map(pick(BANNER_FIELDS))).toEqual([
        {
          id: '1',
          title: 'Test Banner',
          text: 'Test Banner Text',
          cta: null,
          html: null,
          embedUrl: null,
          active: true,
          collapsible: true,
          delay: 0,
          hideForMinutes: 1440,
          showOnArticles: true,
          imageId: null,
          showForLoginStatus: LoginStatus.ALL,
        },
      ]);
      expect(prisma.gate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mode: GateMode.BANNER },
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe('banner', () => {
    it('answers a banner gate', async () => {
      prisma.gate.findUnique.mockResolvedValue(gate);

      expect(await resolver.banner('1')).toMatchObject({ id: '1' });
    });

    it.each([
      ['does not exist', null],
      ['is not a banner', { ...gate, mode: GateMode.PAYWALL }],
    ])('fails when the gate %s', async (_, found) => {
      prisma.gate.findUnique.mockResolvedValue(found);

      await expect(resolver.banner('1')).rejects.toThrow(NotFoundException);
    });

    it('answers an empty title and text for a banner without them', async () => {
      prisma.gate.findUnique.mockResolvedValue({
        ...gate,
        title: null,
        text: null,
      });

      expect(await resolver.banner('1')).toMatchObject({ title: '', text: '' });
    });
  });

  describe('primaryBanner', () => {
    it.each([
      {
        documentType: BannerDocumentType.ARTICLE,
        loggedIn: false,
        hasSubscription: false,
        hasPaywallBypass: false,
      },
      {
        documentType: BannerDocumentType.ARTICLE,
        loggedIn: true,
        hasSubscription: false,
        hasPaywallBypass: false,
      },
      {
        documentType: BannerDocumentType.ARTICLE,
        loggedIn: true,
        hasSubscription: true,
        hasPaywallBypass: true,
      },
      // Page
      {
        documentType: BannerDocumentType.PAGE,
        loggedIn: false,
        hasSubscription: false,
        hasPaywallBypass: false,
      },
      {
        documentType: BannerDocumentType.PAGE,
        loggedIn: true,
        hasSubscription: false,
        hasPaywallBypass: false,
      },
      {
        documentType: BannerDocumentType.PAGE,
        loggedIn: true,
        hasSubscription: true,
        hasPaywallBypass: true,
      },
    ])('should return the first active banner for %o', async values => {
      prisma.gate.findMany.mockResolvedValue(
        [
          LoginStatus.ALL,
          LoginStatus.LOGGED_IN,
          LoginStatus.LOGGED_OUT,
          LoginStatus.SUBSCRIBED,
          LoginStatus.UNSUBSCRIBED,
          LoginStatus.PAYWALL_BYPASSED,
        ].map(audience => ({ ...gate, audience }))
      );

      const result = await resolver.primaryBanner({
        documentId: '1',
        ...values,
      });

      // Unchanged from before banners became gates.
      expect(pick(BANNER_FIELDS, result!)).toMatchSnapshot();
    });

    it('should return null when no primary banner found', async () => {
      prisma.gate.findMany.mockResolvedValue([]);

      expect(
        await resolver.primaryBanner({
          documentType: BannerDocumentType.ARTICLE,
          documentId: '1',
          loggedIn: true,
          hasSubscription: false,
          hasPaywallBypass: false,
        })
      ).toBeNull();
    });
  });

  describe('actions', () => {
    it('answers the actions of the gate', async () => {
      const actions = [
        {
          id: 'a-1',
          label: 'Later',
          url: '#',
          style: 'text',
          role: GateActionRole.CANCEL,
        },
      ];

      expect(await resolver.actions({ id: '1', actions } as any)).toEqual(
        actions
      );
    });
  });

  describe('image', () => {
    it('should return image when imageId exists', () => {
      expect(resolver.image({ imageId: '123' } as any)).toEqual({
        __typename: 'Image',
        id: '123',
      });
    });

    it('should return null when no imageId', () => {
      expect(resolver.image({ imageId: null } as any)).toBeNull();
    });
  });

  describe('showOnPages', () => {
    it('should return pages for banner', async () => {
      prisma.gate.findUnique.mockResolvedValue({
        showOnPages: [{ id: '1' }],
      });

      expect(await resolver.showOnPages({ id: '1' } as any)).toEqual([
        { id: '1' },
      ]);
    });
  });
});
