import { act, fireEvent, render, screen } from '@testing-library/react';
import * as stories from './subscription-list-item.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Subscription Item', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });

  describe('changing the payment method', () => {
    const openChangeDialog = () =>
      fireEvent.click(
        screen.getByText('Zahlungsmethode ändern', { selector: 'button' })
      );

    const submitChangeDialog = () =>
      act(async () => {
        fireEvent.click(screen.getByText('Weiter', { selector: 'button' }));
      });

    it('shows the payment method renewals are charged with', () => {
      render(<storiesCmp.ChangePaymentMethod />);

      expect(screen.getByText('Zahlungsmethode: Rechnung')).toBeInTheDocument();
    });

    it("offers the plan's other payment methods and passes the chosen one on", async () => {
      const changePaymentMethod = vi.fn(async () => undefined);
      render(
        <storiesCmp.ChangePaymentMethod
          changePaymentMethod={changePaymentMethod}
        />
      );

      openChangeDialog();

      // the current payment method is not offered again
      const radio = (value: string) =>
        document.querySelector<HTMLInputElement>(
          `input[type="radio"][value="${value}"]`
        );
      expect(radio('invoice')).toBeNull();
      expect(radio('online')).toBeChecked();

      await submitChangeDialog();

      expect(changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('explains that a hold may be placed but never charged', () => {
      render(<storiesCmp.ChangePaymentMethod />);

      openChangeDialog();

      expect(screen.getByText(/0\.01/)).toBeInTheDocument();
      expect(screen.getByText(/nie belastet/)).toBeInTheDocument();
    });

    it('explains that the open invoice is paid with the new payment method', () => {
      render(<storiesCmp.ChangePaymentMethodWithOpenInvoice />);

      openChangeDialog();

      expect(
        screen.getByText(/offene Rechnung über .*120/)
      ).toBeInTheDocument();
      expect(screen.queryByText(/nie belastet/)).not.toBeInTheDocument();
    });

    it('offers no change without another payment method', () => {
      const { memberPlan } = storiesCmp.ChangePaymentMethod.args as any;
      render(
        <storiesCmp.ChangePaymentMethod
          memberPlan={{
            ...memberPlan,
            availablePaymentMethods: [
              {
                ...memberPlan.availablePaymentMethods[0],
                paymentMethods: [
                  memberPlan.availablePaymentMethods[0].paymentMethods[0],
                ],
              },
            ],
          }}
        />
      );

      expect(
        screen.queryByText('Zahlungsmethode ändern', { selector: 'button' })
      ).not.toBeInTheDocument();
    });

    it('offers no change for a cancelled subscription', () => {
      render(
        <storiesCmp.ChangePaymentMethod
          deactivation={{ date: '2026-01-01', reason: 'userSelfDeactivated' }}
        />
      );

      expect(
        screen.queryByText('Zahlungsmethode ändern', { selector: 'button' })
      ).not.toBeInTheDocument();
    });

    it('shows the method renewing early is charged with and lets the reader change it', () => {
      render(<storiesCmp.ChangePaymentMethod />);

      fireEvent.click(
        screen.getByText('Jetzt verlängern', { selector: 'button' })
      );

      expect(screen.getByText('Belastet wird: Rechnung')).toBeInTheDocument();

      fireEvent.click(
        screen.getAllByText('Zahlungsmethode ändern', { selector: 'button' })[1]
      );

      expect(
        document.querySelector('input[type="radio"][value="online"]')
      ).toBeInTheDocument();
    });
  });

  describe('renewing the current payment method', () => {
    const renewButton = () =>
      screen.queryByText('Bestehende Zahlungsmethode aktualisieren', {
        selector: 'button',
      });

    it('is offered only for payment methods renewals are charged with automatically', () => {
      const { unmount } = render(<storiesCmp.ChangePaymentMethod />);
      expect(renewButton()).not.toBeInTheDocument();
      unmount();

      render(<storiesCmp.RenewPaymentMethod />);
      expect(renewButton()).toBeInTheDocument();
    });

    it('authorizes the current payment method anew after confirmation', async () => {
      const changePaymentMethod = vi.fn(async () => undefined);
      render(
        <storiesCmp.RenewPaymentMethod
          changePaymentMethod={changePaymentMethod}
        />
      );

      fireEvent.click(renewButton()!);

      expect(screen.getByText(/bestätigst Online neu/)).toBeInTheDocument();
      expect(screen.getByText(/0\.01/)).toBeInTheDocument();
      expect(changePaymentMethod).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(screen.getByText('Weiter', { selector: 'button' }));
      });

      expect(changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('explains that the open invoice is paid with the renewed payment method', () => {
      render(<storiesCmp.RenewPaymentMethodWithOpenInvoice />);

      fireEvent.click(renewButton()!);

      expect(
        screen.getByText(/offene Rechnung über .*120/)
      ).toBeInTheDocument();
    });

    it('is not offered while a change is pending or after cancellation', () => {
      const { unmount } = render(
        <storiesCmp.PaymentMethodChangePending canRenewPaymentMethod />
      );
      expect(renewButton()).not.toBeInTheDocument();
      unmount();

      render(
        <storiesCmp.RenewPaymentMethod
          deactivation={{ date: '2026-01-01', reason: 'userSelfDeactivated' }}
        />
      );
      expect(renewButton()).not.toBeInTheDocument();
    });
  });

  describe('a pending payment method change', () => {
    it('tells the reader the change is on its way', () => {
      render(<storiesCmp.PaymentMethodChangePending />);

      expect(
        screen.getByText(/Wechsel zu Online ausstehend/)
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Zahlungsmethode ändern', { selector: 'button' })
      ).not.toBeInTheDocument();
    });

    it('lets the reader continue with the pending payment method', async () => {
      const changePaymentMethod = vi.fn(async () => undefined);
      render(
        <storiesCmp.PaymentMethodChangePending
          changePaymentMethod={changePaymentMethod}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Fortsetzen', { selector: 'button' }));
      });

      expect(changePaymentMethod).toHaveBeenCalledWith('online');
    });

    it('lets the reader cancel the change', async () => {
      const cancelPaymentMethodChange = vi.fn(async () => undefined);
      render(
        <storiesCmp.PaymentMethodChangePending
          cancelPaymentMethodChange={cancelPaymentMethodChange}
        />
      );

      await act(async () => {
        fireEvent.click(
          screen.getByText('Wechsel abbrechen', { selector: 'button' })
        );
      });

      expect(cancelPaymentMethodChange).toHaveBeenCalledWith('change-1');
    });
  });
});
