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

  describe('extending with a payment method choice', () => {
    const openExtendDialog = () =>
      fireEvent.click(
        screen.getByText('Jetzt verlängern', { selector: 'button' })
      );

    const submitExtendDialog = () =>
      act(async () => {
        fireEvent.click(
          screen.getByText(/^Jetzt um .* verlängern$/, { selector: 'button' })
        );
      });

    it("offers the plan's payment methods and passes the chosen one on", async () => {
      const extend = vi.fn(async () => undefined);
      render(<storiesCmp.ExtendWithPaymentMethodChoice extend={extend} />);

      openExtendDialog();

      // the current payment method is preselected
      expect(screen.getByLabelText('Rechnung')).toBeChecked();

      fireEvent.click(screen.getByLabelText('Online (Karte, TWINT)'));
      await submitExtendDialog();

      expect(extend).toHaveBeenCalledWith('online');
    });

    it('extends with the current payment method when the choice is not enabled', async () => {
      const extend = vi.fn(async () => undefined);
      render(<storiesCmp.Default extend={extend} />);

      openExtendDialog();

      expect(screen.queryByRole('radio')).not.toBeInTheDocument();

      await submitExtendDialog();

      expect(extend).toHaveBeenCalledTimes(1);
      expect(extend.mock.calls[0][0]).toBeUndefined();
    });
  });
});
