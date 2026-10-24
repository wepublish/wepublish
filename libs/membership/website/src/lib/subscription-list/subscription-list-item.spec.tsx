import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockMemberPlan,
  mockSubscription,
  mockSubscriptionDeactivation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  PaymentPeriodicity,
  ProductType,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import { BuilderSubscriptionListItemProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { SubscriptionListItem } from './subscription-list-item';

const subscription = mockSubscription({
  memberPlan: mockMemberPlan({ name: 'Jahresabo' }),
  url: 'https://example.com/subscription/1',
  startsAt: '2023-01-01T00:00:00.000Z',
  paidUntil: '2032-01-01T00:00:00.000Z',
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  monthlyAmount: 2500,
  autoRenew: true,
  extendable: true,
  canExtend: true,
});

const type = ProductType.Subscription;

const renderItem = (props: Partial<BuilderSubscriptionListItemProps> = {}) => {
  const actions = {
    cancel: vi.fn(async () => undefined),
    extend: vi.fn(async () => undefined),
  };

  const { container } = renderWithProviders(
    <SubscriptionListItem
      {...subscription}
      {...actions}
      {...props}
    />
  );

  return { ...actions, container, user: userEvent.setup() };
};

const button = (key: string, options?: Record<string, unknown>) =>
  screen.getByRole('button', { name: t(key, options) });
const queryButton = (key: string, options?: Record<string, unknown>) =>
  screen.queryByRole('button', { name: t(key, options) });
const metaLine = (text: string) =>
  screen.getByText(content => content.startsWith(text));

const cancelButton = () => button('subscription.cancel', { type });
const extendButton = () => button('subscription.extendNow');
const extendByQuarter = () =>
  button('subscription.extendBy', {
    subscriptionDuration: t('subscription.paymentPeriod.quarterly'),
  });

const neverResolves = () => new Promise<void>(() => undefined);
const fails = async () => {
  throw new Error('Server error');
};

const deactivated = (reason: SubscriptionDeactivationReason) =>
  mockSubscriptionDeactivation({ date: '2024-02-01T00:00:00.000Z', reason });

describe('SubscriptionListItem', () => {
  it('shows the plan, its dates, costs and a link to the details', () => {
    const { container } = renderItem();

    expect(screen.getByRole('heading', { name: 'Jahresabo' })).toBeVisible();
    expect(
      metaLine(t('subscription.paidUntil')).querySelector('time')
    ).toHaveAttribute('dateTime', '2032-01-01T00:00:00.000Z');
    expect(
      container.querySelector('time[datetime="2023-01-01T00:00:00.000Z"]')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        t('subscription.costs', {
          amount: 'CHF 75.-',
          extendable: true,
          periodicity: PaymentPeriodicity.Quarterly,
        })
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: t('subscription.detailsAndPayments') })
    ).toHaveAttribute('href', 'https://example.com/subscription/1');
  });

  it('says how often an automatically renewing subscription renews', () => {
    renderItem();

    expect(
      screen.getByText(
        t('subscription.autoRenew', {
          periodicityTimeline: t('subscription.paymentTimeline.quarterly'),
        })
      )
    ).toBeInTheDocument();
  });

  it('says how long a manually renewing subscription lasts', () => {
    renderItem({
      autoRenew: false,
      paymentPeriodicity: PaymentPeriodicity.Yearly,
    });

    expect(
      screen.getByText(
        t('subscription.validFor', {
          subscriptionDuration: t('subscription.paymentPeriod.yearly'),
        })
      )
    ).toBeInTheDocument();
  });

  it('shows the costs in the currency of the member plan', () => {
    renderItem({
      memberPlan: { ...subscription.memberPlan, currency: Currency.Eur },
    });

    expect(
      screen.getByText(
        t('subscription.costs', {
          amount: 'EUR 75.00',
          extendable: true,
          periodicity: PaymentPeriodicity.Quarterly,
        })
      )
    ).toBeInTheDocument();
  });

  it('says that an unpaid subscription is unpaid and still lets it be cancelled', () => {
    renderItem({ paidUntil: null, extendable: false, canExtend: false });

    expect(
      screen.getByText(t('subscription.unpaid', { type }))
    ).toBeInTheDocument();
    expect(
      screen.queryByText(t('subscription.paidUntil'), { exact: false })
    ).not.toBeInTheDocument();
    expect(cancelButton()).toBeEnabled();
    expect(queryButton('subscription.extendNow')).not.toBeInTheDocument();
  });

  it('does not offer to cancel a paid subscription that is not extendable', () => {
    renderItem({ extendable: false });

    expect(
      queryButton('subscription.cancel', { type })
    ).not.toBeInTheDocument();
  });

  it('names donations as such', () => {
    renderItem({
      memberPlan: {
        ...subscription.memberPlan,
        productType: ProductType.Donation,
      },
    });

    expect(
      button('subscription.cancel', { type: ProductType.Donation })
    ).toBeInTheDocument();
  });

  it('shows the image of the member plan when it has one', () => {
    const { container } = renderItem();

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('shows no image when the member plan has none', () => {
    const { container } = renderItem({
      memberPlan: { ...subscription.memberPlan, image: null },
    });

    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  describe('cancelling', () => {
    it('cancels after the reader confirms', async () => {
      const { user, cancel } = renderItem();

      await user.click(cancelButton());

      expect(
        screen.getByRole('dialog', {
          name: t('subscription.cancelProduct', { productName: type }),
        })
      ).toBeInTheDocument();

      await user.click(cancelButton());

      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('keeps the subscription when the reader aborts', async () => {
      const { user, cancel } = renderItem();

      await user.click(cancelButton());
      await user.click(button('user.cancel'));

      expect(cancel).not.toHaveBeenCalled();
      expect(cancelButton()).toBeEnabled();
    });

    it('disables the actions while cancelling', async () => {
      const { user } = renderItem({ cancel: vi.fn(neverResolves) });

      await user.click(cancelButton());
      await user.click(cancelButton());

      expect(cancelButton()).toBeDisabled();
      expect(extendButton()).toBeDisabled();
    });

    it('shows why cancelling failed', async () => {
      const { user } = renderItem({ cancel: vi.fn(fails) });

      await user.click(cancelButton());
      await user.click(cancelButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server error'
      );
      expect(cancelButton()).toBeEnabled();
    });
  });

  describe('extending', () => {
    it('extends by one period after the reader confirms', async () => {
      const { user, extend } = renderItem();

      await user.click(extendButton());
      await user.click(extendByQuarter());

      expect(extend).toHaveBeenCalledTimes(1);
    });

    it('does not offer to extend when the subscription cannot be extended', () => {
      renderItem({ canExtend: false });

      expect(queryButton('subscription.extendNow')).not.toBeInTheDocument();
    });

    it('disables the actions while extending', async () => {
      const { user } = renderItem({ extend: vi.fn(neverResolves) });

      await user.click(extendButton());
      await user.click(extendByQuarter());

      expect(extendButton()).toBeDisabled();
      expect(cancelButton()).toBeDisabled();
    });

    it('shows why extending failed', async () => {
      const { user } = renderItem({ extend: vi.fn(fails) });

      await user.click(extendButton());
      await user.click(extendByQuarter());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server error'
      );
    });
  });

  describe('when cancelled', () => {
    const cancelled = {
      deactivation: deactivated(
        SubscriptionDeactivationReason.UserSelfDeactivated
      ),
    };
    const reactivateButton = () => button('subscription.reactivate', { type });

    it('shows the cancellation date and no cancel or extend action', () => {
      renderItem(cancelled);

      expect(
        metaLine(t('subscription.cancelledOn')).querySelector('time')
      ).toHaveAttribute('dateTime', '2024-02-01T00:00:00.000Z');
      expect(
        queryButton('subscription.cancel', { type })
      ).not.toBeInTheDocument();
      expect(queryButton('subscription.extendNow')).not.toBeInTheDocument();
    });

    it('reactivates after the reader confirms', async () => {
      const reactivate = vi.fn(async () => undefined);
      const { user } = renderItem({ ...cancelled, reactivate });

      await user.click(reactivateButton());
      await user.click(reactivateButton());

      expect(reactivate).toHaveBeenCalledTimes(1);
    });

    it('shows why reactivating failed', async () => {
      const { user } = renderItem({ ...cancelled, reactivate: vi.fn(fails) });

      await user.click(reactivateButton());
      await user.click(reactivateButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server error'
      );
    });

    it('does not offer to reactivate without a reactivate action', () => {
      renderItem(cancelled);

      expect(
        queryButton('subscription.reactivate', { type })
      ).not.toBeInTheDocument();
    });

    it('says when it was cancelled because an invoice was not paid', () => {
      renderItem({
        deactivation: deactivated(
          SubscriptionDeactivationReason.InvoiceNotPaid
        ),
      });

      expect(
        screen.getByText(t('subscription.cancelledDueToInvoiceNotPaid'))
      ).toBeInTheDocument();
    });

    it('says when the reason of the cancellation is unknown', () => {
      renderItem({
        deactivation: deactivated(SubscriptionDeactivationReason.None),
      });

      expect(
        screen.getByText(t('subscription.cancelledDueToUnknownReason'))
      ).toBeInTheDocument();
    });
  });

  describe('when upgraded but not yet paid', () => {
    const upgraded = {
      canRevertUpgrade: true,
      reactivate: vi.fn(async () => undefined),
      deactivation: deactivated(
        SubscriptionDeactivationReason.UserReplacedSubscription
      ),
    };
    const revertButton = () => button('subscription.revertUpgrade');

    it('offers to revert the upgrade instead of reactivating', () => {
      renderItem({ ...upgraded, revertUpgrade: vi.fn() });

      expect(revertButton()).toBeEnabled();
      expect(
        queryButton('subscription.reactivate', { type })
      ).not.toBeInTheDocument();
    });

    it('reverts the upgrade after the reader confirms', async () => {
      const revertUpgrade = vi.fn(async () => undefined);
      const { user } = renderItem({ ...upgraded, revertUpgrade });

      await user.click(revertButton());

      expect(
        screen.getByRole('dialog', {
          name: t('subscription.revertUpgradeTitle'),
        })
      ).toBeInTheDocument();

      await user.click(revertButton());

      expect(revertUpgrade).toHaveBeenCalledTimes(1);
    });

    it('shows why reverting the upgrade failed', async () => {
      const { user } = renderItem({
        ...upgraded,
        revertUpgrade: vi.fn(fails),
      });

      await user.click(revertButton());
      await user.click(revertButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server error'
      );
    });
  });

  describe('external reward', () => {
    it('shows a reward that is text', () => {
      renderItem({ externalReward: 'API Token: <FOOBAR>' });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'API Token: <FOOBAR>'
      );
    });

    it('links to a reward that is a URL', () => {
      renderItem({ externalReward: 'https://example.com/reward' });

      expect(
        screen.getByRole('link', {
          name: t('subscription.externalReward', {
            isLink: true,
            externalReward: 'https://example.com/reward',
          }),
        })
      ).toHaveAttribute('href', 'https://example.com/reward');
    });
  });
});
