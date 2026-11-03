import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  createSubscribeBlockContext,
  mockAvailablePaymentMethod,
  mockChallenge,
  mockGoodie,
  mockMemberPlan,
  mockPeriodicityPrice,
  mockSubscribeBlock,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import {
  PaymentPeriodicity,
  SubscribePeriodicityDisplay,
} from '@wepublish/website/api';
import { t } from 'i18next';

import { zwoelfTenant } from '../zwoelf-tenant';
import {
  ZWOELF_SHOP_URL,
  ZwoelfSubscribeBlock,
} from './zwoelf-subscribe-block';

const yearlyAndBiennial = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
  ],
});

const booklet = mockGoodie({
  name: 'Booklet NLA-Legenden',
  paymentPeriodicities: [PaymentPeriodicity.Biennial],
});

const fixedPricing = (yearly: number) => [
  mockPeriodicityPrice({
    periodicity: PaymentPeriodicity.Yearly,
    amountMin: yearly,
    amountTarget: yearly,
    amountMax: yearly,
  }),
  mockPeriodicityPrice({
    periodicity: PaymentPeriodicity.Biennial,
    amountMin: yearly * 2,
    amountTarget: yearly * 2,
    amountMax: yearly * 2,
  }),
];

const basic = mockMemberPlan({
  name: 'Basic',
  slug: 'basic',
  tags: [],
  availablePaymentMethods: [yearlyAndBiennial],
  periodicityPricing: fixedPricing(5900),
  goodies: [booklet],
});

const fankurve = mockMemberPlan({
  name: '#12 - Fankurve',
  slug: 'fankurve',
  tags: ['supporter'],
  availablePaymentMethods: [yearlyAndBiennial],
  periodicityPricing: fixedPricing(11900),
  goodies: [booklet],
});

const loaded = <T,>(data: T) => ({ data, loading: false, error: undefined });

const renderBlock = (query: Record<string, string> = {}) => {
  const subscribeBlock = createSubscribeBlockContext({
    challenge: loaded({ __typename: 'Query', challenge: mockChallenge() }),
    userInvoices: loaded({ __typename: 'Query', userInvoices: [] }),
    userSubscriptions: loaded({ __typename: 'Query', userSubscriptions: [] }),
  });

  renderWithProviders(
    <ZwoelfSubscribeBlock
      {...mockSubscribeBlock({
        memberPlans: [basic, fankurve],
        periodicityDisplay: SubscribePeriodicityDisplay.Toggle,
        showGoodies: true,
      })}
    />,
    { tenant: zwoelfTenant, subscribeBlock, router: { query } }
  );

  return { user: userEvent.setup() };
};

const emailField = () => screen.queryByLabelText(t('user.form.email'));
const planHeading = () => screen.queryByRole('heading', { name: 'Abo wählen' });

describe('ZwoelfSubscribeBlock', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('asks who the subscription is for, the duration and the plan before any personal data', () => {
    renderBlock();

    expect(
      screen.getByRole('heading', { name: 'Für wen ist das Abo?' })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Für mich/ })).toBeChecked();
    expect(
      screen.getByRole('heading', { name: 'Laufzeit wählen' })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1 Jahr' })).toBeChecked();
    expect(planHeading()).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Supporter-Abos' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
    expect(emailField()).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /CHF/ })
    ).not.toBeInTheDocument();
  });

  it('sends gift subscriptions to the shop', async () => {
    const { user } = renderBlock();

    await user.click(screen.getByRole('radio', { name: /Zum Verschenken/ }));

    expect(
      screen.getByRole('link', { name: 'Weiter zum Geschenk-Shop' })
    ).toHaveAttribute('href', ZWOELF_SHOP_URL);
    expect(planHeading()).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Weiter' })
    ).not.toBeInTheDocument();
  });

  it('continues to the personal data after a valid choice and lets the reader go back', async () => {
    const { user } = renderBlock();

    await user.click(screen.getByLabelText('#12 - Fankurve', { exact: false }));
    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    await waitFor(() => expect(emailField()).toBeInTheDocument());
    expect(planHeading()).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Für wen ist das Abo?' })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Gewählt:/)).toHaveTextContent('#12 - Fankurve');

    await user.click(
      screen.getByRole('button', { name: 'Zurück zur Auswahl' })
    );

    await waitFor(() => expect(planHeading()).toBeInTheDocument());
    expect(
      screen.getByLabelText('#12 - Fankurve', { exact: false })
    ).toBeChecked();
  });

  it('includes the booklet with a 2-year subscription', async () => {
    const { user } = renderBlock();

    await user.click(screen.getByRole('radio', { name: /2 Jahre/ }));
    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    await waitFor(() =>
      expect(screen.getByText('Inkl. Booklet NLA-Legenden')).toBeInTheDocument()
    );
    expect(
      screen.queryByRole('radio', { name: t('subscribe.goodie.none') })
    ).not.toBeInTheDocument();
  });

  it('starts with the personal data when plan and duration come from the link', () => {
    renderBlock({ memberPlanBySlug: 'fankurve', periodicity: 'biennial' });

    expect(emailField()).toBeInTheDocument();
    expect(planHeading()).not.toBeInTheDocument();
    expect(screen.getByText(/Gewählt:/)).toHaveTextContent(
      '2 Jahre · #12 - Fankurve'
    );
  });
});
