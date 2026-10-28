import { createTheme, ThemeProvider } from '@mui/material';
import {
  act,
  fireEvent,
  render as rtlRender,
  screen,
} from '@testing-library/react';
import { ButtonHTMLAttributes, ReactElement } from 'react';
import type { StripePayment as StripePaymentType } from './stripe-payment';

const confirmPayment = vi.fn();
const confirmSetup = vi.fn();

// The storybook setup file already loaded this module with the real Stripe
// hooks, so a hoisted `vi.mock` would not reach it: mock, then import afresh.
vi.doMock('@stripe/react-stripe-js', () => ({
  PaymentElement: ({ onReady }: { onReady: () => void }) => {
    onReady();
    return null;
  },
  useStripe: () => ({ confirmPayment, confirmSetup }),
  useElements: () => ({}),
}));

vi.doMock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    elements: {
      Button: ({
        variant,
        ...props
      }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
        <button {...props} />
      ),
    },
  }),
}));

vi.doMock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('StripePayment', () => {
  let StripePayment: typeof StripePaymentType;

  beforeAll(async () => {
    vi.resetModules();
    ({ StripePayment } = await import('./stripe-payment'));
  });

  const render = (ui: ReactElement) =>
    rtlRender(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

  beforeEach(() => {
    confirmPayment.mockReset().mockResolvedValue({});
    confirmSetup.mockReset().mockResolvedValue({});
  });

  const submit = async (label: string) => {
    await act(async () => {
      fireEvent.click(screen.getByText(label));
    });
  };

  it('confirms a payment by default', async () => {
    const onClose = vi.fn();
    render(<StripePayment onClose={onClose} />);

    await submit('user.pay');

    expect(confirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: 'if_required' })
    );
    expect(confirmSetup).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('confirms a SetupIntent in setup mode, without a charge', async () => {
    const onClose = vi.fn();
    render(
      <StripePayment
        mode="setup"
        onClose={onClose}
      />
    );

    await submit('user.authorize');

    expect(confirmSetup).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: 'if_required' })
    );
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('shows the error Stripe reports and stays open', async () => {
    confirmSetup.mockResolvedValue({ error: { message: 'Card declined' } });
    const onClose = vi.fn();
    render(
      <StripePayment
        mode="setup"
        onClose={onClose}
      />
    );

    await submit('user.authorize');

    expect(screen.getByText('Card declined')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes unsuccessfully when confirming throws', async () => {
    confirmPayment.mockRejectedValue(new Error('Network down'));
    const onClose = vi.fn();
    render(<StripePayment onClose={onClose} />);

    await submit('user.pay');

    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('closes unsuccessfully when the reader cancels', () => {
    const onClose = vi.fn();
    render(<StripePayment onClose={onClose} />);

    fireEvent.click(screen.getByText('user.cancel'));

    expect(onClose).toHaveBeenCalledWith(false);
  });
});
