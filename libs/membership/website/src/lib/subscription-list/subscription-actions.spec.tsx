import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPaymentMethod,
  mockSubscriptionDeactivation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullSubscriptionPaymentMethodChangeFragment,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { t } from 'i18next';

import { subscriptionFixture } from '../membership.fixtures';
import { paymentMethodLabel } from '../payment-method-label';
import {
  IMMEDIATE_ACTIONS,
  SubscriptionActions,
  SubscriptionActionsProps,
} from './subscription-actions';

// the plan offers other payment methods than the subscription's own
const subscription = subscriptionFixture(
  { memberPlan: mockMemberPlan(), paymentMethod: mockPaymentMethod() },
  { canExtend: true, canRenewPaymentMethod: true }
);

const pendingChange: FullSubscriptionPaymentMethodChangeFragment = {
  __typename: 'SubscriptionPaymentMethodChange',
  id: 'change-1',
  createdAt: '2026-10-20T00:00:00.000Z',
  kind: PaymentMethodChangeKind.Authorization,
  state: PaymentMethodChangeState.Pending,
  amount: 1,
  currency: Currency.Chf,
  expiresAt: '2026-11-03T00:00:00.000Z',
  completedAt: null,
  paymentMethod: mockPaymentMethod({ name: 'Payrexx' }),
};

const handlers = {
  cancel: vi.fn(async () => undefined),
  extend: vi.fn(async () => undefined),
  changePaymentMethod: vi.fn(async () => undefined),
  cancelPaymentMethodChange: vi.fn(async () => undefined),
};

const renderActions = (props: Partial<SubscriptionActionsProps> = {}) =>
  renderWithProviders(
    <SubscriptionActions
      {...subscription}
      {...handlers}
      {...props}
    />
  );

const buttonNames = () =>
  screen.queryAllByRole('button').map(button => button.textContent);

describe('SubscriptionActions', () => {
  it('offers every action by default', () => {
    renderActions();

    expect(buttonNames()).toEqual(
      expect.arrayContaining([
        'Abo kündigen',
        'Bestehende Zahlungsmethode aktualisieren',
        'Zahlungsmethode anpassen',
        'Jetzt verlängern',
      ])
    );
  });

  it('offers only the actions it is given', () => {
    renderActions({ actions: ['extend'] });

    expect(buttonNames()).toEqual(['Jetzt verlängern']);
  });

  it('shows a pending payment method change only when asked to', () => {
    renderActions({
      pendingPaymentMethodChange: pendingChange,
      actions: ['extend'],
    });
    expect(screen.queryByText(/Wechsel zu Payrexx ausstehend/)).toBeNull();
  });

  it('shows a pending payment method change with its own buttons', () => {
    renderActions({
      pendingPaymentMethodChange: pendingChange,
      actions: ['pendingChange'],
    });

    expect(
      screen.getByText(/Wechsel zu Payrexx ausstehend/)
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual(['Wechsel abbrechen', 'Fortsetzen']);
  });

  it('asks to extend early in plain words', async () => {
    renderActions({ actions: ['extend'] });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Jetzt verlängern' }));

    const dialog = screen.getByRole('dialog', { name: 'Abo verlängern' });
    expect(dialog).toHaveTextContent(
      'Deine frühzeitige Abo-Verlängerung um 1 Jahr erhöht unsere Planungssicherheit. Danke für diese Unterstützung!'
    );
    expect(dialog).not.toHaveTextContent('{');
    // the dialog's buttons ask that already
    expect(dialog).not.toHaveTextContent('Weiterfahren');
  });

  it('asks to cancel in plain words', async () => {
    renderActions({ actions: ['cancel'] });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Abo kündigen' }));

    const dialog = screen.getByRole('dialog', {
      name: 'Willst du dein Abo wirklich kündigen?',
    });
    expect(dialog).toHaveTextContent(
      'Durch die Kündigung beendest du eine wertvolle Unterstützung. Dein Abo wird danach nicht mehr verlängert, bleibt aber bis zum Ablaufdatum gültig. Gibt es offene Rechnungen zum Abo, werden diese storniert.'
    );
  });

  it('asks to reactivate under a plain heading', async () => {
    renderActions({
      actions: ['reactivate'],
      reactivate: vi.fn(async () => undefined),
      deactivation: mockSubscriptionDeactivation(),
    });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Abo reaktivieren' }));

    expect(
      screen.getByRole('dialog', { name: 'Abo reaktivieren' })
    ).toBeInTheDocument();
  });

  it('keeps cancelling and the payment method out of the immediate actions', () => {
    renderActions({ actions: IMMEDIATE_ACTIONS });

    expect(buttonNames()).toEqual(['Jetzt verlängern']);
  });

  describe('changing the payment method, by name', () => {
    it('sets the payment methods apart from the explanation below', async () => {
      const { dialog } = await renderChange([card]);

      const choice = within(dialog).getByText(/^Aktuelle Zahlungsmethode/)
        .parentElement as HTMLElement;
      expect(parseFloat(getComputedStyle(choice).marginBottom)).toBeGreaterThan(
        0
      );
    });

    const method = (id: string, name: string, paymentProviderID: string) =>
      mockPaymentMethod({ id, name, slug: id, paymentProviderID });
    const bexio = method('bexio', 'bexio', 'bexio');
    const card = method('card', 'Kreditkarte', 'payrexx');
    const twint = method('twint', 'TWINT', 'payrexx');

    const renderChange = async (
      options: ReturnType<typeof method>[],
      start: 'changePaymentMethod' | 'extend' = 'changePaymentMethod'
    ) => {
      const changePaymentMethod = vi.fn(async () => undefined);
      renderWithProviders(
        <SubscriptionActions
          {...subscriptionFixture(
            {
              memberPlan: mockMemberPlan({
                availablePaymentMethods: [
                  mockAvailablePaymentMethod({
                    paymentPeriodicities: [PaymentPeriodicity.Yearly],
                    paymentMethods: [bexio, ...options],
                  }),
                ],
              }),
              paymentMethod: bexio,
            },
            { paymentPeriodicity: PaymentPeriodicity.Yearly, canExtend: true }
          )}
          cancel={handlers.cancel}
          extend={handlers.extend}
          changePaymentMethod={changePaymentMethod}
          variant="table"
          actions={[start]}
          paymentMethodLabel={paymentMethod =>
            paymentMethodLabel(t, paymentMethod)
          }
        />
      );

      const user = userEvent.setup();
      await user.click(
        screen.getByRole('button', {
          name:
            start === 'extend' ? 'Jetzt verlängern' : (
              'Zahlungsmethode anpassen'
            ),
        })
      );

      return { dialog: screen.getByRole('dialog'), user, changePaymentMethod };
    };

    it('is headed like the button that opens it', async () => {
      const { dialog } = await renderChange([card]);

      expect(
        within(dialog).getByRole('heading', {
          name: 'Zahlungsmethode anpassen',
        })
      ).toBeInTheDocument();
    });

    it('names the current payment method and the choices, without logos', async () => {
      const { dialog } = await renderChange([card, twint]);

      expect(dialog).toHaveTextContent('Aktuelle Zahlungsmethode: Rechnung');
      expect(dialog).toHaveTextContent('Zahlungsmethode ändern auf:');
      expect(
        within(dialog).getByText('Rechnung', { selector: 'strong' })
      ).toBeInTheDocument();
      // the same label twice, so the names tell them apart
      expect(
        within(dialog)
          .getAllByRole('radio')
          .map(
            radio =>
              radio.getAttribute('aria-label') ??
              radio.closest('label')?.textContent
          )
      ).toEqual(['Online-Zahlung (Kreditkarte)', 'Online-Zahlung (TWINT)']);
      expect(within(dialog).getAllByRole('radio')[0]).toBeChecked();
      expect(dialog.querySelector('img')).toBeNull();
    });

    it('names the payment method of an early extension, with a way to change it', async () => {
      const { dialog, user } = await renderChange([card], 'extend');

      expect(dialog).toHaveTextContent('Zahlung per: Rechnung');
      expect(
        within(dialog).getByText('Rechnung', { selector: 'strong' })
      ).toBeInTheDocument();
      const change = within(dialog).getByRole('button', {
        name: 'Zahlungsmethode anpassen',
      });
      expect(change.className).toMatch(/MuiButton-outlined/);

      // the same dialog as from the payment section
      await user.click(change);
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Aktuelle Zahlungsmethode: Rechnung'
      );
    });

    it('changes to the payment method chosen', async () => {
      const { dialog, user, changePaymentMethod } = await renderChange([
        card,
        twint,
      ]);

      await user.click(
        within(dialog).getByRole('radio', { name: 'Online-Zahlung (TWINT)' })
      );
      await user.click(within(dialog).getByRole('button', { name: 'Weiter' }));

      expect(changePaymentMethod).toHaveBeenCalledWith('twint');
    });

    it('names the only payment method there is to change to', async () => {
      const { dialog, user, changePaymentMethod } = await renderChange([card]);

      expect(within(dialog).queryByRole('radio')).toBeNull();
      expect(dialog).toHaveTextContent(
        'Zahlungsmethode ändern auf: Online-Zahlung'
      );
      expect(
        within(dialog).getByText('Online-Zahlung', { selector: 'strong' })
      ).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Weiter' }));
      expect(changePaymentMethod).toHaveBeenCalledWith('card');
    });
  });
});
