import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockPaymentMethod,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullPaymentMethodFragment } from '@wepublish/website/api';
import { BuilderPaymentMethodPickerProps } from '@wepublish/website/builder';
import { PaymentMethodPicker } from './payment-method-picker';

const stripe = mockPaymentMethod({
  id: 'stripe',
  name: 'Stripe',
  paymentProviderID: 'stripe',
  description: 'Mit Kreditkarte',
});

const payrexx = mockPaymentMethod({
  id: 'payrexx',
  name: 'Payrexx',
  paymentProviderID: 'payrexx',
  description: 'Mit TWINT',
});

const noCharge = mockPaymentMethod({
  id: 'no-charge',
  name: 'Gratis',
  paymentProviderID: 'no-charge',
  description: 'Ohne Kosten',
});

const renderPaymentMethodPicker = (
  props: Partial<BuilderPaymentMethodPickerProps> = {}
) => {
  const onChange = vi.fn();

  renderWithProviders(
    <PaymentMethodPicker
      paymentMethods={[stripe, payrexx]}
      onChange={onChange}
      {...props}
    />
  );

  return { onChange, user: userEvent.setup() };
};

const methodRadio = ({ description, name }: FullPaymentMethodFragment) =>
  screen.getByRole('radio', { name: `${description} ${name}` });

describe('PaymentMethodPicker', () => {
  it('names each payment method by its description and name', () => {
    renderPaymentMethodPicker();

    expect(screen.getAllByRole('radio')).toEqual([
      methodRadio(stripe),
      methodRadio(payrexx),
    ]);
  });

  it('picks the first payment method when nothing is chosen yet', () => {
    const { onChange } = renderPaymentMethodPicker();

    expect(onChange).toHaveBeenCalledWith('stripe');
  });

  it('picks the first payment method when the chosen one is not offered', () => {
    const { onChange } = renderPaymentMethodPicker({ value: 'paypal' });

    expect(onChange).toHaveBeenCalledWith('stripe');
  });

  it('keeps the chosen payment method', () => {
    const { onChange } = renderPaymentMethodPicker({ value: 'payrexx' });

    expect(methodRadio(payrexx)).toBeChecked();
    expect(methodRadio(stripe)).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports the id of the picked payment method', async () => {
    const { user, onChange } = renderPaymentMethodPicker({ value: 'stripe' });

    await user.click(methodRadio(payrexx));

    expect(onChange).toHaveBeenCalledWith('payrexx');
  });

  it('hides the no-charge payment method', () => {
    renderPaymentMethodPicker({
      paymentMethods: [stripe, payrexx, noCharge],
      value: 'stripe',
    });

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(
      screen.queryByRole('radio', { name: 'Ohne Kosten Gratis' })
    ).not.toBeInTheDocument();
  });

  it('does not pick anything when there are no payment methods', () => {
    const { onChange } = renderPaymentMethodPicker({ paymentMethods: [] });

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
