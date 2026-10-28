import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPaymentMethod,
  mockSubscription,
  mockSubscriptionDeactivation,
  mockSubscriptionPaymentMethodChange,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  PaymentMethodChangeKind,
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

const invoicePaymentMethod = mockPaymentMethod({
  id: 'invoice',
  name: 'Rechnung',
  slug: 'invoice',
  description: 'Per Post',
  paymentProviderID: 'bexio',
});
const onlinePaymentMethod = mockPaymentMethod({
  id: 'online',
  name: 'Online',
  slug: 'online',
  description: 'Karte, TWINT',
  paymentProviderID: 'payrexx',
});

const withPaymentMethods = (
  ...availablePaymentMethods: ReturnType<typeof mockAvailablePaymentMethod>[]
) => ({
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  paymentMethod: invoicePaymentMethod,
  memberPlan: { ...subscription.memberPlan, availablePaymentMethods },
});

const changeable = withPaymentMethods(
  mockAvailablePaymentMethod({
    paymentPeriodicities: [PaymentPeriodicity.Yearly],
    paymentMethods: [invoicePaymentMethod, onlinePaymentMethod],
  })
);

const pendingChange = mockSubscriptionPaymentMethodChange({
  id: 'change-1',
  kind: PaymentMethodChangeKind.Authorization,
  expiresAt: '2026-11-04T12:00:00.000Z',
  paymentMethod: onlinePaymentMethod,
});

const changeActions = () => ({
  changePaymentMethod: vi.fn(async (_paymentMethodId: string) => undefined),
  cancelPaymentMethodChange: vi.fn(async (_id: string) => undefined),
});

const changePaymentMethodButton = () =>
  button('subscription.changePaymentMethod');
const queryChangePaymentMethodButton = () =>
  queryButton('subscription.changePaymentMethod');
const submitChangeButton = () =>
  button('subscription.changePaymentMethodSubmit');
const paymentMethodRadio = (paymentMethod: {
  name: string;
  description: string;
}) =>
  screen.queryByRole('radio', {
    name: `${paymentMethod.description} ${paymentMethod.name}`,
  });
const authorizationExplanation = () =>
  t('subscription.changePaymentMethodAuthorization', { amount: 'CHF 0.01' });
const openInvoiceExplanation = () =>
  t('subscription.changePaymentMethodOpenInvoice', {
    amount: 'CHF 120.-',
    type,
  });

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

  describe('changing the payment method', () => {
    it('shows the payment method renewals are charged with', () => {
      renderItem(changeable);

      expect(
        screen.getByText(
          t('subscription.paymentMethod', { paymentMethod: 'Rechnung' })
        )
      ).toBeInTheDocument();
    });

    it("offers the plan's other payment methods and passes the chosen one on", async () => {
      const actions = changeActions();
      const { user } = renderItem({ ...changeable, ...actions });

      await user.click(changePaymentMethodButton());

      expect(
        screen.getByRole('dialog', {
          name: t('subscription.changePaymentMethodTitle'),
        })
      ).toBeInTheDocument();
      expect(paymentMethodRadio(invoicePaymentMethod)).not.toBeInTheDocument();
      expect(paymentMethodRadio(onlinePaymentMethod)).toBeChecked();

      await user.click(submitChangeButton());

      expect(actions.changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('keeps the payment method when the reader aborts', async () => {
      const actions = changeActions();
      const { user } = renderItem({ ...changeable, ...actions });

      await user.click(changePaymentMethodButton());
      await user.click(button('user.cancel'));

      expect(actions.changePaymentMethod).not.toHaveBeenCalled();
    });

    it('explains that a hold may be placed but never charged', async () => {
      const { user } = renderItem({ ...changeable, ...changeActions() });

      await user.click(changePaymentMethodButton());

      expect(screen.getByText(authorizationExplanation())).toBeInTheDocument();
    });

    it('explains that the open invoice is paid with the new payment method', async () => {
      const { user } = renderItem({
        ...changeable,
        ...changeActions(),
        canExtend: false,
        openInvoiceTotal: 12000,
      });

      await user.click(changePaymentMethodButton());

      expect(screen.getByText(openInvoiceExplanation())).toBeInTheDocument();
      expect(
        screen.queryByText(authorizationExplanation())
      ).not.toBeInTheDocument();
    });

    it('shows why changing the payment method failed', async () => {
      const { user } = renderItem({
        ...changeable,
        changePaymentMethod: vi.fn(fails),
      });

      await user.click(changePaymentMethodButton());
      await user.click(submitChangeButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Server error'
      );
    });

    it('offers no change without another payment method', () => {
      renderItem({
        ...withPaymentMethods(
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Yearly],
            paymentMethods: [invoicePaymentMethod],
          })
        ),
        ...changeActions(),
      });

      expect(queryChangePaymentMethodButton()).not.toBeInTheDocument();
    });

    it('only offers payment methods of the billing period that the subscription can switch to', async () => {
      const providerManaged = mockPaymentMethod({
        id: 'payrexx-subscription',
        name: 'Payrexx Abo',
        slug: 'payrexx-subscription',
        description: 'Abo',
      });
      const monthlyOnly = mockPaymentMethod({
        id: 'monthly',
        name: 'Monatlich',
        description: 'Nur monatlich',
      });
      const autoRenewalOnly = mockPaymentMethod({
        id: 'auto-renewal',
        name: 'Automatisch',
        description: 'Nur automatisch',
      });
      const { user } = renderItem({
        ...withPaymentMethods(
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Yearly],
            paymentMethods: [
              invoicePaymentMethod,
              onlinePaymentMethod,
              providerManaged,
            ],
          }),
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Yearly],
            paymentMethods: [onlinePaymentMethod],
          }),
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Monthly],
            paymentMethods: [monthlyOnly],
          }),
          mockAvailablePaymentMethod({
            paymentPeriodicities: [PaymentPeriodicity.Yearly],
            forceAutoRenewal: true,
            paymentMethods: [autoRenewalOnly],
          })
        ),
        autoRenew: false,
        ...changeActions(),
      });

      await user.click(changePaymentMethodButton());

      expect(screen.getAllByRole('radio')).toHaveLength(1);
      expect(paymentMethodRadio(onlinePaymentMethod)).toBeInTheDocument();
    });

    it('offers no change for a cancelled subscription', () => {
      renderItem({
        ...changeable,
        ...changeActions(),
        deactivation: deactivated(
          SubscriptionDeactivationReason.UserSelfDeactivated
        ),
      });

      expect(queryChangePaymentMethodButton()).not.toBeInTheDocument();
    });

    it('offers no change without a change action', () => {
      renderItem(changeable);

      expect(queryChangePaymentMethodButton()).not.toBeInTheDocument();
    });

    it('shows the payment method extending is charged with and lets the reader change it', async () => {
      const { user } = renderItem({ ...changeable, ...changeActions() });

      await user.click(extendButton());

      const extendDialog = screen.getByRole('dialog', {
        name: t('subscription.extendEarly', { type }),
      });
      expect(extendDialog).toHaveTextContent(
        t('subscription.extendChargedWith', { paymentMethod: 'Rechnung' })
      );

      await user.click(
        within(extendDialog).getByRole('button', {
          name: t('subscription.changePaymentMethod'),
        })
      );

      expect(
        await screen.findByRole('dialog', {
          name: t('subscription.changePaymentMethodTitle'),
        })
      ).toBeInTheDocument();
      expect(paymentMethodRadio(onlinePaymentMethod)).toBeInTheDocument();
    });
  });

  describe('renewing the current payment method', () => {
    const renewable = {
      ...changeable,
      paymentMethod: onlinePaymentMethod,
      canRenewPaymentMethod: true,
    };
    const renewButton = () => button('subscription.renewPaymentMethod');
    const queryRenewButton = () =>
      queryButton('subscription.renewPaymentMethod');

    it('is not offered for a payment method that cannot be renewed', () => {
      renderItem({ ...changeable, ...changeActions() });

      expect(queryRenewButton()).not.toBeInTheDocument();
    });

    it('is offered for a payment method that can be renewed', () => {
      renderItem({ ...renewable, ...changeActions() });

      expect(renewButton()).toBeInTheDocument();
    });

    it('authorizes the current payment method anew after the reader confirms', async () => {
      const actions = changeActions();
      const { user } = renderItem({ ...renewable, ...actions });

      await user.click(renewButton());

      const dialog = screen.getByRole('dialog', {
        name: t('subscription.renewPaymentMethodTitle'),
      });
      expect(dialog).toHaveTextContent(
        t('subscription.renewPaymentMethodConfirmation', {
          paymentMethod: 'Online',
        })
      );
      expect(dialog).toHaveTextContent(authorizationExplanation());
      expect(actions.changePaymentMethod).not.toHaveBeenCalled();

      await user.click(submitChangeButton());

      expect(actions.changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('explains that the open invoice is paid with the renewed payment method', async () => {
      const { user } = renderItem({
        ...renewable,
        ...changeActions(),
        canExtend: false,
        openInvoiceTotal: 12000,
      });

      await user.click(renewButton());

      expect(screen.getByText(openInvoiceExplanation())).toBeInTheDocument();
    });

    it('is not offered while a change is pending', () => {
      renderItem({
        ...renewable,
        ...changeActions(),
        pendingPaymentMethodChange: pendingChange,
      });

      expect(queryRenewButton()).not.toBeInTheDocument();
    });

    it('is not offered for a cancelled subscription', () => {
      renderItem({
        ...renewable,
        ...changeActions(),
        deactivation: deactivated(
          SubscriptionDeactivationReason.UserSelfDeactivated
        ),
      });

      expect(queryRenewButton()).not.toBeInTheDocument();
    });
  });

  describe('a pending payment method change', () => {
    const pending = {
      ...changeable,
      canExtend: false,
      pendingPaymentMethodChange: pendingChange,
    };

    it('tells the reader the change is on its way and offers no other change', () => {
      renderItem({ ...pending, ...changeActions() });

      const [beforeExpiry] = t('subscription.paymentMethodChangePending', {
        paymentMethod: 'Online',
        kind: PaymentMethodChangeKind.Authorization,
        expiresAt: '|',
      }).split('|');

      expect(screen.getByRole('alert')).toHaveTextContent(
        `${beforeExpiry}04.11.2026`
      );
      expect(queryChangePaymentMethodButton()).not.toBeInTheDocument();
    });

    it('lets the reader continue with the pending payment method', async () => {
      const actions = changeActions();
      const { user } = renderItem({ ...pending, ...actions });

      await user.click(button('subscription.paymentMethodChangeContinue'));

      expect(actions.changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('lets the reader cancel the change', async () => {
      const actions = changeActions();
      const { user } = renderItem({ ...pending, ...actions });

      await user.click(button('subscription.paymentMethodChangeCancel'));

      expect(actions.cancelPaymentMethodChange).toHaveBeenCalledWith(
        'change-1'
      );
    });
  });
});
