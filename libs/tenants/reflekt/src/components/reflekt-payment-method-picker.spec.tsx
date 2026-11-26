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
import { euclidCircularB } from '../theme';
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

const question = 'Zahlungsmittel wählen';
const { white, black } = reflektTenant.createTheme().palette.common;

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

  it('labels the choice for screen readers without a visible heading', () => {
    renderPicker({ value: 'payrexx' });

    expect(screen.queryByText(question)).not.toBeInTheDocument();
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

  it('shows the chosen payment method white on black and the other inverted', () => {
    renderPicker({ value: 'payrexx' });

    const chosen = getComputedStyle(methodCard(cards));
    const other = getComputedStyle(methodCard(invoice));

    expect(chosen.backgroundColor).toBe(white);
    expect(chosen.color).toBe(black);
    expect(chosen.borderStyle).toBe('none');
    expect(chosen.boxShadow).not.toBe('none');

    expect(other.backgroundColor).toBe(black);
    expect(other.color).toBe(white);
    expect(other.boxShadow).toBe('none');
  });

  it('sets the payment method names in Euclid Circular B at 12px', () => {
    renderPicker({ value: 'payrexx' });

    const name = getComputedStyle(screen.getByText(invoice.name));

    expect(name.fontFamily).toMatch(
      new RegExp(`^"?${euclidCircularB.family}"?, ?sans-serif$`)
    );
    expect(name.fontWeight).toBe('500');
    expect(name.fontSize).toBe('12px');
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
