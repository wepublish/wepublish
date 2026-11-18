import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  createSubscribeBlockContext,
  DEFAULT_TEST_VIEWPORT_WIDTH,
  mockAvailablePaymentMethod,
  mockChallenge,
  mockMemberPlan,
  mockPeriodicityPrice,
  mockRichTextParagraph,
  mockSubscribeBlock,
  mockSubscribeBlockRenderSetting,
  renderWithProviders,
  resetTranslations,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
  SubscribeBlockRenderLayout,
} from '@wepublish/website/api';
import { t } from 'i18next';

import { tsriTenant } from '../../tsri-tenant';
import { TsriBlockRenderer } from '../tsri-block-renderer';
import { isTsriMembershipSubscribe } from './tsri-membership-subscribe';
import { TsriSubscribeType } from './tsri-subscribe-type';

const monthlyAndYearly = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly],
});

const plan = (
  name: string,
  monthly: number,
  shortDescription: string,
  description: string,
  availablePaymentMethods = [monthlyAndYearly]
) =>
  mockMemberPlan({
    name,
    slug: name.toLowerCase(),
    defaultPaymentPeriodicity: PaymentPeriodicity.Yearly,
    availablePaymentMethods,
    shortDescription: mockRichTextParagraph(shortDescription),
    description: mockRichTextParagraph(description),
    periodicityPricing: [
      mockPeriodicityPrice({
        periodicity: PaymentPeriodicity.Monthly,
        amountMin: monthly,
        amountTarget: monthly,
        amountMax: null,
      }),
      mockPeriodicityPrice({
        periodicity: PaymentPeriodicity.Yearly,
        amountMin: monthly * 12,
        amountTarget: monthly * 12,
        amountMax: null,
      }),
    ],
  });

const chlii = plan(
  'Chlii',
  1000,
  'Die Mitgliedschaft für alle.',
  'Unabhängiger Lokaljournalismus für Zürich'
);
const mega = plan(
  'Mega',
  1500,
  'Damit finanzieren wir unabhängigen Journalismus.',
  'Du ermöglichst grössere Recherchen'
);
const legendaer = plan(
  'Legendär',
  3000,
  'Für alle, die möglichst viel bewirken wollen.',
  'Einladung zum Apéro auf der Redaktion'
);

const fixedAmount = (memberPlan: FullMemberPlanFragment, isDefault = false) =>
  mockSubscribeBlockRenderSetting({ memberPlanId: memberPlan.id, isDefault });

const loaded = <T,>(data: T) => ({ data, loading: false, error: undefined });

const yearlyOnly = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [PaymentPeriodicity.Yearly],
});

const jahresAbo = plan(
  'Jahres-Abo',
  2000,
  'Nur jährlich.',
  'Ein ganzes Jahr Tsüri',
  [yearlyOnly]
);

const membershipBlock = (
  blockStyle: string | null = 'Membership',
  extraPlans: FullMemberPlanFragment[] = []
) =>
  mockSubscribeBlock({
    blockStyle,
    memberPlans: [chlii, mega, legendaer, ...extraPlans],
    fields: ['FirstName'],
    memberPlanRenderSettings: [
      fixedAmount(chlii),
      mockSubscribeBlockRenderSetting({
        memberPlanId: mega.id,
        isDefault: true,
        layout: {
          __typename: 'SubscribeBlockLayoutPickerConfig',
          type: SubscribeBlockRenderLayout.Picker,
          showInput: true,
          values: [1500, 2000],
          valuesByPeriodicity: [],
        },
      }),
      fixedAmount(legendaer),
    ],
  });

const renderBlock = (extraPlans: FullMemberPlanFragment[] = []) => {
  const subscribeBlock = createSubscribeBlockContext({
    challenge: loaded({ __typename: 'Query', challenge: mockChallenge() }),
    userInvoices: loaded({ __typename: 'Query', userInvoices: [] }),
    userSubscriptions: loaded({ __typename: 'Query', userSubscriptions: [] }),
  });

  renderWithProviders(
    <TsriBlockRenderer
      block={membershipBlock('Membership', extraPlans)}
      index={0}
      count={1}
    />,
    { tenant: tsriTenant, subscribeBlock }
  );

  return { user: userEvent.setup() };
};

const card = (name: string) =>
  screen.getByRole('radio', { name }).closest('label') as HTMLElement;

const summary = (memberPlan: string, price: string, unit: string) =>
  screen.getByText(
    t('tsri.membership.summary', { memberPlan, price, unit }) as string
  );

describe('TsriMembershipSubscribe', () => {
  beforeAll(() => applyTenantTranslations(tsriTenant));
  afterAll(() => resetTranslations());
  afterEach(() => setTestViewportWidth(DEFAULT_TEST_VIEWPORT_WIDTH));

  it('is picked for a subscribe block with the Membership block style', () => {
    expect(TsriSubscribeType.Membership).toBe('Membership');
    expect(isTsriMembershipSubscribe(membershipBlock())).toBe(true);
    expect(isTsriMembershipSubscribe(membershipBlock(null))).toBe(false);
    expect(
      isTsriMembershipSubscribe({
        __typename: 'BreakBlock',
        blockStyle: 'Membership',
      } as never)
    ).toBe(false);
  });

  it('shows a card per plan with its texts and the yearly price per month', () => {
    renderBlock();

    expect(screen.getByRole('radio', { name: 'Mega' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Chlii' })).not.toBeChecked();

    const chliiCard = within(card('Chlii'));
    expect(chliiCard.getByText('CHF 10')).toBeInTheDocument();
    expect(
      chliiCard.getByText(t('tsri.membership.perMonth') as string)
    ).toBeInTheDocument();
    expect(
      chliiCard.getByText(
        t('tsri.membership.billedPeriodically', {
          price: 'CHF 120',
          unit: 'Jahr',
          timeline: 'jährlich',
        }) as string
      )
    ).toBeInTheDocument();
    expect(
      chliiCard.getByText('Die Mitgliedschaft für alle.')
    ).toBeInTheDocument();
    expect(
      chliiCard.getByText('Unabhängiger Lokaljournalismus für Zürich')
    ).toBeInTheDocument();
    expect(
      chliiCard.getByText(t('tsri.membership.select') as string)
    ).toBeInTheDocument();

    expect(
      within(card('Mega')).getByText(t('tsri.membership.selected') as string)
    ).toBeInTheDocument();
    expect(summary('Mega', 'CHF 180', 'Jahr')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', {
        name: t('tsri.membership.selectedPlan') as string,
      })
    ).not.toBeInTheDocument();
  });

  it('selects a plan by its card and sums the choice up', async () => {
    const { user } = renderBlock();

    await user.click(card('Legendär'));

    expect(screen.getByRole('radio', { name: 'Legendär' })).toBeChecked();
    expect(
      within(card('Legendär')).getByText(
        t('tsri.membership.selected') as string
      )
    ).toBeInTheDocument();
    expect(summary('Legendär', 'CHF 360', 'Jahr')).toBeInTheDocument();
  });

  it('puts the periodicity toggle above the plans and bills monthly with it', async () => {
    const { user } = renderBlock();
    const monthly = screen.getByRole('button', { name: 'Monatlich' });

    expect(
      monthly.compareDocumentPosition(
        screen.getByRole('radio', { name: 'Chlii' })
      )
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await user.click(monthly);

    const chliiCard = within(card('Chlii'));
    expect(chliiCard.getByText('CHF 10')).toBeInTheDocument();
    expect(
      chliiCard.getByText(t('tsri.membership.billedMonthly') as string)
    ).toBeInTheDocument();
    expect(summary('Mega', 'CHF 15', 'Monat')).toBeInTheDocument();
  });

  it('keeps every plan selectable and the toggle complete when a plan only bills yearly', async () => {
    const { user } = renderBlock([jahresAbo]);
    const toggle = (name: string) => screen.getByRole('button', { name });

    await user.click(toggle('Monatlich'));

    const jahresAboRadio = screen.getByRole('radio', { name: 'Jahres-Abo' });
    expect(jahresAboRadio).toBeEnabled();

    await user.click(card('Jahres-Abo'));

    expect(jahresAboRadio).toBeChecked();
    expect(toggle('Monatlich')).toBeInTheDocument();
    expect(toggle('Jährlich')).toHaveAttribute('aria-pressed', 'true');
    expect(summary('Jahres-Abo', 'CHF 240', 'Jahr')).toBeInTheDocument();

    await user.click(toggle('Monatlich'));

    expect(screen.getByRole('radio', { name: 'Chlii' })).toBeChecked();
    expect(toggle('Monatlich')).toHaveAttribute('aria-pressed', 'true');
    expect(summary('Chlii', 'CHF 10', 'Monat')).toBeInTheDocument();
  });

  it('shows the selected plan once more for small screens', async () => {
    const selectedPlan = () =>
      within(
        screen.getByRole('region', {
          name: t('tsri.membership.selectedPlan') as string,
        })
      );

    setTestViewportWidth(375);
    const { user } = renderBlock();

    expect(selectedPlan().getByText('Mega')).toBeInTheDocument();
    expect(
      selectedPlan().getByText('Du ermöglichst grössere Recherchen')
    ).toBeInTheDocument();

    await user.click(card('Chlii'));

    expect(selectedPlan().getByText('Chlii')).toBeInTheDocument();
    expect(selectedPlan().queryByText('Mega')).not.toBeInTheDocument();
  });

  it('lets the reader set an own amount only for plans that offer one', async () => {
    const { user } = renderBlock();
    const amountInput = () =>
      screen.queryByRole('textbox', { name: /^CHF Min/ });
    const customAmount = () =>
      screen.queryByRole('button', {
        name: t('tsri.membership.customAmount') as string,
      });

    expect(amountInput()).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: t('tsri.membership.customAmount') as string,
      })
    );

    expect(amountInput()).toBeInTheDocument();
    expect(customAmount()).not.toBeInTheDocument();

    await user.click(card('Chlii'));

    expect(amountInput()).not.toBeInTheDocument();
    expect(customAmount()).not.toBeInTheDocument();
  });

  it('asks for the personal data with a plain submit button and the tsri texts', async () => {
    renderBlock();

    expect(
      screen.getByRole('button', {
        name: t('tsri.membership.submit') as string,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(t('tsri.membership.transactionFee') as string)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t('user.form.email'))).toBeInTheDocument();

    const benefits = within(
      screen.getByRole('list', {
        name: t('tsri.membership.benefits.label') as string,
      })
    );

    for (const benefit of [
      'cancellable',
      'securePayment',
      'instantAccess',
    ] as const) {
      expect(
        benefits.getByText(t(`tsri.membership.benefits.${benefit}`) as string)
      ).toBeInTheDocument();
    }
  });
});
