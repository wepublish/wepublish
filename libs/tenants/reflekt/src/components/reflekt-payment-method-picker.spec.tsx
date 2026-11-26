import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  mockImage,
  mockPaymentMethod,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullPaymentMethodFragment } from '@wepublish/website/api';
import { BuilderPaymentMethodPickerProps } from '@wepublish/website/builder';

import { reflektTenant } from '../reflekt-tenant';
import { ReflektPaymentMethodPicker } from './reflekt-payment-method-picker';

const cards = mockPaymentMethod({
  id: 'payrexx',
  name: 'Karte, TWINT & Co.',
  paymentProviderID: 'payrexx',
  image: mockImage({ description: 'TWINT, VISA, Mastercard' }),
});

const invoice = mockPaymentMethod({
  id: 'payrexx-invoice',
  name: 'Rechnung',
  paymentProviderID: 'payrexx_invoice',
  image: null,
});

const noCharge = mockPaymentMethod({
  id: 'no-charge',
  name: 'Gratis',
  paymentProviderID: 'no-charge',
});

const question = 'Wie möchtest du bezahlen?';

const renderPicker = (props: Partial<BuilderPaymentMethodPickerProps> = {}) => {
  const onChange = vi.fn();

  renderWithProviders(
    <ReflektPaymentMethodPicker
      paymentMethods={[cards, invoice]}
      onChange={onChange}
      {...props}
    />,
    { tenant: reflektTenant }
  );

  return { onChange, user: userEvent.setup() };
};

const methodRadio = ({ name }: FullPaymentMethodFragment) =>
  screen.getByRole('radio', { name });

const methodCard = (method: FullPaymentMethodFragment) =>
  methodRadio(method).closest('label') as HTMLElement;

describe('ReflektPaymentMethodPicker', () => {
  beforeAll(() => applyTenantTranslations(reflektTenant));
  afterAll(() => resetTranslations());

  it('asks the reader how they want to pay and labels the choice with it', () => {
    renderPicker({ value: 'payrexx' });

    expect(screen.getByText(question)).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: question })).toBeVisible();
  });

  it('names each payment method visibly', () => {
    renderPicker({ value: 'payrexx' });

    expect(screen.getByText(cards.name)).toBeVisible();
    expect(screen.getByText(invoice.name)).toBeVisible();
    expect(screen.getAllByRole('radio')).toEqual([
      methodRadio(cards),
      methodRadio(invoice),
    ]);
  });

  it('shows which payment method is chosen', () => {
    const { onChange } = renderPicker({ value: 'payrexx' });

    expect(methodRadio(cards)).toBeChecked();
    expect(methodRadio(invoice)).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('greys out the payment method that is not chosen', () => {
    renderPicker({ value: 'payrexx' });

    expect(getComputedStyle(methodCard(cards)).opacity).toBe('1');
    expect(getComputedStyle(methodCard(invoice)).opacity).toBe('0.6');
  });

  it('reports the id of the picked payment method', async () => {
    const { user, onChange } = renderPicker({ value: 'payrexx' });

    await user.click(screen.getByText(invoice.name));

    expect(onChange).toHaveBeenCalledWith('payrexx-invoice');
  });

  it('picks the first payment method when nothing is chosen yet', () => {
    const { onChange } = renderPicker();

    expect(onChange).toHaveBeenCalledWith('payrexx');
  });

  it('picks the first payment method when the chosen one is not offered', () => {
    const { onChange } = renderPicker({ value: 'stripe' });

    expect(onChange).toHaveBeenCalledWith('payrexx');
  });

  it('hides the no-charge payment method', () => {
    renderPicker({
      paymentMethods: [cards, invoice, noCharge],
      value: 'payrexx',
    });

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.queryByText(noCharge.name)).not.toBeInTheDocument();
  });

  it('offers no choice when there is only one payment method', () => {
    const { onChange } = renderPicker({ paymentMethods: [cards] });

    expect(screen.queryByText(question)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(
      screen.getByRole('img', { name: 'TWINT, VISA, Mastercard' })
    ).toBeVisible();
    expect(onChange).toHaveBeenCalledWith('payrexx');
  });
});
