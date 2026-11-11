import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockMemberPlan,
  mockSubscription,
  mockSubscriptionDeactivation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/website/api';
import { BuilderSubscriptionListProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { SubscriptionList } from './subscription-list';

const type = ProductType.Subscription;

const subscriptionFor = (id: string, name: string) =>
  mockSubscription({
    id,
    memberPlan: mockMemberPlan({ name }),
    paymentPeriodicity: PaymentPeriodicity.Quarterly,
    canExtend: true,
  });

const monthly = subscriptionFor('monthly', 'Monatsabo');
const yearly = subscriptionFor('yearly', 'Jahresabo');
const cancelled: FullSubscriptionFragment = {
  ...subscriptionFor('cancelled', 'Gönnerabo'),
  deactivation: mockSubscriptionDeactivation(),
};

const renderSubscriptionList = (
  subscriptions: FullSubscriptionFragment[] | undefined,
  props: Partial<BuilderSubscriptionListProps> = {}
) => {
  const callbacks = {
    onCancel: vi.fn(async () => undefined),
    onExtend: vi.fn(async () => undefined),
    onReactivate: vi.fn(async () => undefined),
    onRevertUpgrade: vi.fn(async () => undefined),
  };

  renderWithProviders(
    <SubscriptionList
      data={
        subscriptions && {
          __typename: 'Query',
          userSubscriptions: subscriptions,
        }
      }
      loading={false}
      error={undefined}
      invoices={{ data: undefined, loading: false, error: undefined }}
      subscribeUrl="/mitmachen"
      {...callbacks}
      {...props}
    />
  );

  return { ...callbacks, user: userEvent.setup() };
};

const confirmButton = (name: string) => screen.getByRole('button', { name });

describe('SubscriptionList', () => {
  it('shows every subscription', () => {
    renderSubscriptionList([monthly, yearly]);

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Monatsabo', 'Jahresabo']);
  });

  it('extends the chosen subscription', async () => {
    const { user, onExtend } = renderSubscriptionList([monthly, yearly]);

    await user.click(
      screen.getAllByRole('button', { name: t('subscription.extendNow') })[1]
    );
    await user.click(
      confirmButton(
        t('subscription.extendBy', {
          subscriptionDuration: t('subscription.paymentPeriod.quarterly'),
        })
      )
    );

    expect(onExtend).toHaveBeenCalledWith('yearly');
  });

  it('cancels the chosen subscription', async () => {
    const { user, onCancel } = renderSubscriptionList([monthly, yearly]);
    const cancelName = t('subscription.cancel', { type });

    await user.click(screen.getAllByRole('button', { name: cancelName })[0]);
    await user.click(confirmButton(cancelName));

    expect(onCancel).toHaveBeenCalledWith('monthly');
  });

  it('reactivates the chosen subscription', async () => {
    const { user, onReactivate } = renderSubscriptionList([monthly, cancelled]);
    const reactivateName = t('subscription.reactivate', { type });

    await user.click(screen.getByRole('button', { name: reactivateName }));
    await user.click(confirmButton(reactivateName));

    expect(onReactivate).toHaveBeenCalledWith('cancelled');
  });

  it('reverts the upgrade of the chosen subscription', async () => {
    const { user, onRevertUpgrade } = renderSubscriptionList([
      monthly,
      { ...cancelled, canRevertUpgrade: true },
    ]);
    const revertName = t('subscription.revertUpgrade');

    await user.click(screen.getByRole('button', { name: revertName }));
    await user.click(confirmButton(revertName));

    expect(onRevertUpgrade).toHaveBeenCalledWith('cancelled');
  });

  it('does not offer to reactivate without a reactivate callback', () => {
    renderSubscriptionList([cancelled], { onReactivate: undefined });

    expect(
      screen.queryByRole('button', {
        name: t('subscription.reactivate', { type }),
      })
    ).not.toBeInTheDocument();
  });

  it('links to the subscribe page when there are no subscriptions', () => {
    renderSubscriptionList([]);

    expect(
      screen.getByText(t('subscription.noActiveSubscriptions'), {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: t('subscription.subscribeNow') })
    ).toHaveAttribute('href', '/mitmachen');
  });

  it('does not claim there are no subscriptions while loading', () => {
    renderSubscriptionList(undefined, { loading: true });

    expect(
      screen.queryByRole('link', { name: t('subscription.subscribeNow') })
    ).not.toBeInTheDocument();
  });

  it('shows the error instead of the empty message', () => {
    renderSubscriptionList(undefined, { error: new Error('Network down') });

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    expect(
      screen.queryByRole('link', { name: t('subscription.subscribeNow') })
    ).not.toBeInTheDocument();
  });
});
