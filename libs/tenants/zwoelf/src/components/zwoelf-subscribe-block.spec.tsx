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
  FirstPrintIssueChoice,
  PaymentPeriodicity,
  PrintIssueStartDocument,
  SubscribePeriodicityDisplay,
} from '@wepublish/website/api';
import { t } from 'i18next';

import { zwoelfTenant } from '../zwoelf-tenant';
import {
  ZWOELF_SHOP_URL,
  ZwoelfSubscribeBlock,
  zwoelfSubscribeExtras,
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

const issue = (
  id: string,
  label: string,
  title: string | null,
  day: string
) => ({
  __typename: 'PublicPrintIssue' as const,
  id,
  label,
  title,
  issueDate: day,
});

const printIssueStart = (
  start: {
    current: ReturnType<typeof issue>;
    upcoming: ReturnType<typeof issue> | null;
  } | null = {
    current: issue('issue-117', '#117', 'Fankurve', '2026-11-13'),
    upcoming: issue('issue-118', '#118', null, '2026-12-11'),
  }
) => ({
  request: { query: PrintIssueStartDocument },
  result: {
    data: {
      printIssueStart: start && { __typename: 'PrintIssueStart', ...start },
    },
  },
});

const renderBlock = (
  query: Record<string, string> = {},
  // nothing to choose unless a test says otherwise
  mocks: ReturnType<typeof printIssueStart>[] = [printIssueStart(null)],
  plans = [basic, fankurve]
) => {
  const subscribeBlock = createSubscribeBlockContext({
    challenge: loaded({ __typename: 'Query', challenge: mockChallenge() }),
    userInvoices: loaded({ __typename: 'Query', userInvoices: [] }),
    userSubscriptions: loaded({ __typename: 'Query', userSubscriptions: [] }),
  });

  renderWithProviders(
    <ZwoelfSubscribeBlock
      {...mockSubscribeBlock({
        memberPlans: plans,
        periodicityDisplay: SubscribePeriodicityDisplay.Toggle,
        showGoodies: true,
      })}
    />,
    { tenant: zwoelfTenant, subscribeBlock, router: { query }, mocks }
  );

  return { user: userEvent.setup() };
};

const emailField = () => screen.queryByLabelText(t('user.form.email'));
const planHeading = () => screen.queryByRole('heading', { name: 'Abo wählen' });

describe('ZwoelfSubscribeBlock', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  describe('Abo-Start: the first printed issue', () => {
    const aboStart = () =>
      screen.queryByRole('combobox', { name: 'Abo-Start' });

    it('asks for it on the first step, starting on «Ausgabe wählen»', async () => {
      renderBlock({}, [printIssueStart()]);

      const select = await screen.findByRole('combobox', { name: 'Abo-Start' });

      expect(select).toHaveValue('');
      expect(
        Array.from((select as HTMLSelectElement).options).map(o => o.text)
      ).toEqual([
        'Ausgabe wählen',
        'Aktuelle Ausgabe #117 · Fankurve',
        'Kommende Ausgabe #118 · erscheint am 11.12.2026',
      ]);
    });

    it('stays on the first step until it is chosen, then names it in the summary', async () => {
      const { user } = renderBlock({}, [printIssueStart()]);
      const select = await screen.findByRole('combobox', { name: 'Abo-Start' });

      await user.click(screen.getByRole('button', { name: 'Weiter' }));

      expect(
        await screen.findByText(
          'Bitte wähle, mit welcher Ausgabe dein Abo beginnt.'
        )
      ).toBeInTheDocument();
      expect(emailField()).not.toBeInTheDocument();

      await user.selectOptions(select, 'current');
      await user.click(screen.getByRole('button', { name: 'Weiter' }));

      await waitFor(() => expect(emailField()).toBeInTheDocument());
      expect(screen.getByText(/Gewählt:/)).toHaveTextContent('Abo-Start: #117');
      expect(aboStart()).not.toBeInTheDocument();
    });

    it('offers the next issue without a number while it is not created yet', async () => {
      renderBlock({}, [
        printIssueStart({
          current: issue('issue-117', '#117', null, '2026-11-13'),
          upcoming: null,
        }),
      ]);

      const select = await screen.findByRole('combobox', { name: 'Abo-Start' });

      expect(
        Array.from((select as HTMLSelectElement).options).map(o => o.text)
      ).toEqual([
        'Ausgabe wählen',
        'Aktuelle Ausgabe #117',
        'Kommende Ausgabe',
      ]);
    });

    it('is not asked for where nothing is printed or nothing shipped yet', async () => {
      const digital = {
        ...basic,
        periodicityPricing: basic.periodicityPricing.map(price => ({
          ...price,
          printIssues: 0,
        })),
      };
      const { user } = renderBlock({}, [printIssueStart()], [digital]);

      await user.click(screen.getByRole('button', { name: 'Weiter' }));
      await waitFor(() => expect(emailField()).toBeInTheDocument());

      renderBlock({}, [printIssueStart(null)]);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'Weiter' })).toHaveLength(
          1
        )
      );
      expect(aboStart()).not.toBeInTheDocument();
    });

    it('asks for it on the second step when a link skipped the first', async () => {
      renderBlock({ memberPlanBySlug: 'fankurve', periodicity: 'yearly' }, [
        printIssueStart(),
      ]);

      await waitFor(() => expect(emailField()).toBeInTheDocument());
      expect(
        await screen.findByRole('combobox', { name: 'Abo-Start' })
      ).toHaveValue('');
    });
  });

  describe('zwoelfSubscribeExtras', () => {
    const start = {
      current: issue('issue-117', '#117', null, '2026-11-13'),
      upcoming: null,
    };

    it('sends the chosen issue with the subscription', () => {
      expect(
        zwoelfSubscribeExtras({ applies: true, choice: 'upcoming', start })
      ).toEqual({
        firstPrintIssue: {
          currentIssueId: 'issue-117',
          choice: FirstPrintIssueChoice.Upcoming,
        },
      });
    });

    it('stops the submit while it applies but is not chosen, and adds nothing otherwise', () => {
      expect(zwoelfSubscribeExtras({ applies: true, choice: '', start })).toBe(
        false
      );
      expect(
        zwoelfSubscribeExtras({ applies: false, choice: '', start })
      ).toEqual({});
    });
  });

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
