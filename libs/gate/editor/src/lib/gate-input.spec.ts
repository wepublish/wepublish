import {
  FullGateFragment,
  GateActionRole,
  GateMode,
  LoginStatus,
} from '@wepublish/editor/api';
import {
  bannerFromGate,
  BannerFormValues,
  contentGateFromGate,
  ContentGateFormValues,
  paywallFromGate,
  PaywallFormValues,
  toBannerGateInput,
  toContentGateGateInput,
  toPaywallGateInput,
} from './gate-input';

const loadedGate = (overrides: Partial<FullGateFragment>): FullGateFragment =>
  ({
    __typename: 'Gate',
    id: 'gate-1',
    createdAt: '2026-10-14',
    modifiedAt: '2026-10-14',
    mode: GateMode.Paywall,
    name: null,
    active: true,
    audience: LoginStatus.All,
    anyMemberPlan: false,
    memberPlans: [],
    bypasses: [],
    showOnArticles: false,
    showOnPages: [],
    title: null,
    text: null,
    cta: null,
    html: null,
    embedUrl: null,
    image: null,
    description: null,
    upgradeDescription: null,
    circumventDescription: null,
    upgradeCircumventDescription: null,
    softDescription: null,
    actions: [],
    previewBlocks: null,
    fadeout: false,
    freeArticles: null,
    softGateArticles: null,
    meterWindowDays: null,
    newsletterParams: [],
    newsletterNeverGate: false,
    newsletterFreeArticles: 0,
    collapsible: true,
    hideForMinutes: 1440,
    delay: 0,
    ...overrides,
  }) as FullGateFragment;

const primary = (url: string, label = '') => ({
  __typename: 'GateAction' as const,
  id: 'action-1',
  label,
  url,
  style: '',
  role: GateActionRole.Primary,
});

describe('paywall', () => {
  const paywall: PaywallFormValues = {
    name: 'Premium',
    description: null,
    circumventDescription: null,
    upgradeDescription: null,
    upgradeCircumventDescription: null,
    active: true,
    anyMemberPlan: false,
    memberPlanIds: ['plan-1'],
    bypasses: [{ token: 'token-1' }],
    alternativeSubscribeUrl: 'https://example.com/abo',
    fadeout: true,
    hideContentAfter: 4,
  };

  it('sends the subscribe url as the primary action and hideContentAfter as previewBlocks', () => {
    expect(toPaywallGateInput(paywall)).toEqual({
      name: 'Premium',
      description: null,
      circumventDescription: null,
      upgradeDescription: null,
      upgradeCircumventDescription: null,
      active: true,
      anyMemberPlan: false,
      memberPlanIds: ['plan-1'],
      bypassTokens: ['token-1'],
      fadeout: true,
      previewBlocks: 4,
      actions: [
        {
          label: '',
          url: 'https://example.com/abo',
          style: '',
          role: GateActionRole.Primary,
        },
      ],
    });
  });

  it('sends no action without a subscribe url', () => {
    expect(
      toPaywallGateInput({ ...paywall, alternativeSubscribeUrl: '' }).actions
    ).toEqual([]);
  });

  it('reads a loaded paywall back into the form', () => {
    expect(
      paywallFromGate(
        loadedGate({
          name: 'Premium',
          audience: LoginStatus.Unsubscribed,
          memberPlans: [{ __typename: 'MemberPlan', id: 'plan-1', name: 'A' }],
          bypasses: [{ __typename: 'GateBypass', id: 'b-1', token: 'token-1' }],
          actions: [primary('https://example.com/abo')],
          previewBlocks: 4,
          fadeout: true,
        })
      )
    ).toEqual({
      ...paywall,
      memberPlans: [{ __typename: 'MemberPlan', id: 'plan-1', name: 'A' }],
      bypasses: [{ id: 'b-1', token: 'token-1' }],
    });
  });
});

describe('banner', () => {
  const banner: BannerFormValues = {
    title: 'Hi',
    text: 'Text',
    cta: null,
    html: null,
    embedUrl: null,
    active: true,
    collapsible: true,
    delay: 2,
    hideForMinutes: 60,
    showOnArticles: true,
    showForLoginStatus: LoginStatus.LoggedOut,
    imageId: 'image-1',
    showOnPages: [{ id: 'page-1' }],
    actions: [
      { label: 'Later', url: '#', style: 'text', role: GateActionRole.Cancel },
    ],
  };

  it('sends the login status as audience and the pages as ids', () => {
    expect(toBannerGateInput(banner)).toEqual({
      title: 'Hi',
      text: 'Text',
      cta: null,
      html: null,
      embedUrl: null,
      active: true,
      collapsible: true,
      delay: 2,
      hideForMinutes: 60,
      showOnArticles: true,
      audience: LoginStatus.LoggedOut,
      imageId: 'image-1',
      showOnPageIds: ['page-1'],
      actions: [
        {
          label: 'Later',
          url: '#',
          style: 'text',
          role: GateActionRole.Cancel,
        },
      ],
    });
  });

  it('clears the image when it was removed', () => {
    expect(toBannerGateInput({ ...banner, imageId: undefined }).imageId).toBe(
      null
    );
  });

  it('only sends what an action input accepts', () => {
    expect(
      toBannerGateInput({
        ...banner,
        actions: [{ ...primary('/abo', 'Abo'), id: 'a-1' } as any],
      }).actions
    ).toEqual([
      { label: 'Abo', url: '/abo', style: '', role: GateActionRole.Primary },
    ]);
  });

  it('reads a loaded banner back into the form', () => {
    expect(
      bannerFromGate(
        loadedGate({
          mode: GateMode.Banner,
          title: 'Hi',
          text: 'Text',
          audience: LoginStatus.LoggedOut,
          showOnArticles: true,
          showOnPages: [{ __typename: 'PageModel', id: 'page-1' }],
          image: { id: 'image-1' } as any,
          actions: [primary('/abo', 'Abo')],
          delay: 2,
          hideForMinutes: 60,
        })
      )
    ).toMatchObject({
      title: 'Hi',
      text: 'Text',
      showForLoginStatus: LoginStatus.LoggedOut,
      imageId: 'image-1',
      image: { id: 'image-1' },
      showOnPages: [{ id: 'page-1' }],
      actions: [primary('/abo', 'Abo')],
      delay: 2,
      hideForMinutes: 60,
    });
  });
});

describe('content gate', () => {
  const gate: ContentGateFormValues = {
    name: 'Registration wall',
    active: true,
    audience: LoginStatus.LoggedOut,
    freeArticles: 3,
    softGateArticles: 2,
    previewBlocks: 3,
    meterWindowDays: 30,
    ctaLabel: 'Sign up',
    ctaUrl: '/signup',
    softDescription: null,
    hardDescription: null,
    newsletterParams: [{ key: 'utm_medium', value: 'email' }],
    newsletterNeverGate: false,
    newsletterFreeArticles: 0,
  };

  it('sends the hard description as description and the CTA as the primary action', () => {
    expect(toContentGateGateInput(gate)).toEqual({
      name: 'Registration wall',
      active: true,
      audience: LoginStatus.LoggedOut,
      freeArticles: 3,
      softGateArticles: 2,
      previewBlocks: 3,
      meterWindowDays: 30,
      softDescription: null,
      description: null,
      newsletterParams: [{ key: 'utm_medium', value: 'email' }],
      newsletterNeverGate: false,
      newsletterFreeArticles: 0,
      actions: [
        {
          label: 'Sign up',
          url: '/signup',
          style: '',
          role: GateActionRole.Primary,
        },
      ],
    });
  });

  it('sends no action without a CTA url', () => {
    expect(toContentGateGateInput({ ...gate, ctaUrl: null }).actions).toEqual(
      []
    );
  });

  it('drops newsletter params without a key', () => {
    expect(
      toContentGateGateInput({
        ...gate,
        newsletterParams: [{ key: ' ', value: 'email' }],
      }).newsletterParams
    ).toEqual([]);
  });

  it('reads a loaded content gate back into the form', () => {
    expect(
      contentGateFromGate(
        loadedGate({
          mode: GateMode.ContentGate,
          name: 'Registration wall',
          audience: LoginStatus.LoggedOut,
          freeArticles: 3,
          softGateArticles: 2,
          previewBlocks: 3,
          meterWindowDays: 30,
          actions: [primary('/signup', 'Sign up')],
          newsletterParams: [
            {
              __typename: 'ContentGateNewsletterParam',
              key: 'utm_medium',
              value: 'email',
            },
          ],
        })
      )
    ).toEqual(gate);
  });
});
