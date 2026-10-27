import { screen, within } from '@testing-library/react';
import {
  mockSubscriptionPaymentMethodChange,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';

import { SubscriptionEdit } from './subscription-edit';
import * as fixtures from './subscription-edit.fixtures';
import { SubscriptionEditFixture } from './subscription-edit.fixtures';

const { Default, Cancelled, TopPlan, PaymentMethodNotChangeable } = fixtures;
type Story = SubscriptionEditFixture;

const subscriptionOf = ({ props }: Story): FullSubscriptionFragment => {
  const [subscription] = props.data?.userSubscriptions ?? [];

  if (!subscription) {
    throw new Error('a fixture without a subscription');
  }

  return subscription;
};
const subscription = subscriptionOf(Default);

const renderStory = async (
  story: Story,
  overrides: Partial<FullSubscriptionFragment> = {}
) => {
  const { props, mocks } = story;
  renderWithProviders(
    <SubscriptionEdit
      {...props}
      data={{
        __typename: 'Query',
        userSubscriptions: [{ ...subscriptionOf(story), ...overrides }],
      }}
    />,
    { mocks }
  );
  await actWait(100);
};

const section = (name: string) => screen.getByRole('region', { name });

describe('SubscriptionEdit', () => {
  for (const [name, fixture] of Object.entries(fixtures)) {
    it(`should render ${name}`, async () => {
      await renderStory(fixture);
    });
  }

  it('has a section each for the plan, payment, renewal and invoices', async () => {
    await renderStory(Default);

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Abo', 'Zahlung', 'Verlängerung & Kündigung', 'Rechnungen']);
  });

  it('sets each section title on a band like the history header', async () => {
    await renderStory(Default);

    for (const heading of screen.getAllByRole('heading')) {
      const band = heading.closest('header') as HTMLElement;
      // grey[100]; jsdom keeps the hex notation
      expect(getComputedStyle(band).backgroundColor).toMatch(
        /^(#f5f5f5|rgb\(245, 245, 245\))$/
      );
    }
  });

  it('indents the content of each section under its title', async () => {
    await renderStory(Default);

    for (const name of ['Abo', 'Zahlung', 'Verlängerung & Kündigung']) {
      const band = within(section(name)).getByRole('heading').closest('header');
      const content = band?.nextElementSibling as HTMLElement;
      expect(parseFloat(getComputedStyle(content).paddingLeft)).toBeGreaterThan(
        0
      );
    }
  });

  it('shows the plan with its state, dates, amount and reward', async () => {
    await renderStory(Default);

    const plan = section('Abo');
    expect(within(plan).getByText('Jahresabo')).toBeInTheDocument();
    expect(within(plan).getByText('Aktiv')).toBeInTheDocument();
    expect(within(plan).getByText('Beginn')).toBeInTheDocument();
    expect(within(plan).getByText('Bezahlt bis')).toBeInTheDocument();
    expect(within(plan).getByText(/pro Jahr/)).toBeInTheDocument();
    expect(within(plan).getByText(/Gutschein NW-2026/)).toBeInTheDocument();
  });

  describe('upgrade', () => {
    it('links to the upgrade flow while a more expensive plan fits', async () => {
      await renderStory(Default);

      expect(
        within(section('Abo')).getByRole('link', { name: 'Abo upgraden' })
      ).toHaveAttribute('href', '/mitmachen?upgradeSubscriptionId=yearly');
    });

    it.each([
      ['when cancelled', Cancelled, {}],
      ['on the most expensive plan', TopPlan, {}],
      [
        'with a pending payment method change',
        Default,
        {
          pendingPaymentMethodChange: {
            __typename: 'SubscriptionPaymentMethodChange',
            id: 'change',
            createdAt: '2026-10-25T00:00:00.000Z',
            kind: 'change',
            state: 'pending',
            amount: 1,
            currency: 'chf',
            expiresAt: '2026-11-01T00:00:00.000Z',
            completedAt: null,
            paymentMethod: subscription.paymentMethod,
          } as never,
        },
      ],
      ['while an upgrade can be reverted', Default, { canRevertUpgrade: true }],
      [
        'without a plan in the same billing period',
        Default,
        { paymentPeriodicity: PaymentPeriodicity.Monthly },
      ],
    ] as [string, Story, Partial<FullSubscriptionFragment>][])(
      'is not offered %s',
      async (_, Story, overrides) => {
        await renderStory(Story, overrides);

        expect(
          screen.queryByRole('link', { name: 'Abo upgraden' })
        ).not.toBeInTheDocument();
      }
    );
  });

  it('names the payment method and offers to change it', async () => {
    await renderStory(Default);

    const payment = section('Zahlung');
    expect(
      within(payment).getByText('Zahlungsmethode: Online-Zahlung')
    ).toBeInTheDocument();
    expect(
      within(payment).getByRole('button', { name: 'Zahlungsmethode anpassen' })
    ).toBeInTheDocument();
  });

  it('offers changing the payment method as a button, not a text link', async () => {
    await renderStory(Default);

    const change = within(section('Zahlung')).getByRole('button', {
      name: 'Zahlungsmethode anpassen',
    });
    expect(change.className).not.toMatch(/MuiButton-text/);
  });

  it.each([
    ['running', Default],
    ['cancelled', Cancelled],
  ] as [string, Story][])(
    'aligns every button to the right (%s)',
    async (_, Story) => {
      await renderStory(Story);

      const buttons = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('link', { name: 'Abo upgraden' }),
      ];
      expect(buttons.length).toBeGreaterThan(0);
      for (const button of buttons) {
        expect(
          getComputedStyle(button.parentElement as HTMLElement).justifyContent
        ).toBe('flex-end');
      }
    }
  );

  it('names a pending payment method change the way readers know it', async () => {
    await renderStory(Default, {
      pendingPaymentMethodChange: mockSubscriptionPaymentMethodChange({
        paymentMethod: subscription.paymentMethod,
      }),
    });

    const payment = section('Zahlung');
    expect(payment).toHaveTextContent('Online-Zahlung');
    expect(payment).not.toHaveTextContent('Payrexx');
  });

  it('says so when the payment method cannot be changed', async () => {
    await renderStory(PaymentMethodNotChangeable);

    const payment = section('Zahlung');
    expect(within(payment).queryByRole('button')).not.toBeInTheDocument();
    expect(
      within(payment).getByText(
        'Die Zahlungsmethode dieses Abos kann online nicht geändert werden.'
      )
    ).toBeInTheDocument();
  });

  it('offers cancelling with the renewal', async () => {
    await renderStory(Default);

    const renewal = section('Verlängerung & Kündigung');
    expect(
      within(renewal).getByText('Wird automatisch jährlich erneuert')
    ).toBeInTheDocument();
    expect(
      within(renewal).getByRole('button', { name: 'Abo kündigen' })
    ).toBeInTheDocument();
  });

  it('offers reactivating a cancelled subscription', async () => {
    await renderStory(Cancelled);

    const renewal = section('Verlängerung & Kündigung');
    expect(within(renewal).getByText(/Gekündigt per/)).toBeInTheDocument();
    expect(
      within(renewal).getByRole('button', { name: 'Abo reaktivieren' })
    ).toBeInTheDocument();
    expect(
      within(renewal).queryByRole('button', { name: 'Abo kündigen' })
    ).not.toBeInTheDocument();
  });

  it('lists all invoices under their own column labels', async () => {
    await renderStory(Default);

    const invoices = section('Rechnungen');
    const [header] = within(invoices).getAllByRole('row');
    expect(
      [...header.querySelectorAll('th')].map(cell => cell.textContent)
    ).toEqual(['Rechnung', 'Status', 'Erstellt am', 'Fällig am', 'Betrag', '']);
    expect(within(invoices).getByText('Jahresabo 2024')).toBeInTheDocument();
  });
});
