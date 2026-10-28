import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';
import { ComponentProps, useState } from 'react';
import { PaymentAmountPicker } from './payment-amount-picker';

type PickerProps = ComponentProps<typeof PaymentAmountPicker>;

const ControlledPaymentAmountPicker = (props: PickerProps) => {
  const [value, setValue] = useState(props.value);

  return (
    <PaymentAmountPicker
      {...props}
      value={value}
      onChange={amount => {
        props.onChange(amount);
        setValue(amount);
      }}
    />
  );
};

const renderPicker = (props: Partial<PickerProps> = {}) => {
  const onChange = vi.fn();

  renderWithProviders(
    <ControlledPaymentAmountPicker
      amountPerMonthMin={1000}
      amountPerMonthTarget={1500}
      currency={Currency.Eur}
      value={1500}
      presetAmounts={[1000, 1500, 2000]}
      donate={false}
      error={undefined}
      {...props}
      onChange={onChange}
    />
  );

  return { onChange, user: userEvent.setup() };
};

const amountRadios = () => screen.getAllByRole('radio', { hidden: true });
const presetRadio = (name: string) =>
  screen.getByRole('radio', { name, hidden: true });
const checkedValues = () =>
  amountRadios()
    .filter(radio => (radio as HTMLInputElement).checked)
    .map(radio => (radio as HTMLInputElement).value);
const manualInput = () => screen.getByRole('textbox');

describe('PaymentAmountPicker', () => {
  it('offers the preset amounts and a manual amount', () => {
    renderPicker();

    expect(amountRadios().map(radio => radio.getAttribute('value'))).toEqual([
      '1000',
      '1500',
      '2000',
      '0',
    ]);
    expect(presetRadio('EUR 15')).toBeChecked();
  });

  it('reports the picked preset amount', async () => {
    const { user, onChange } = renderPicker();

    await user.click(presetRadio('EUR 20'));

    expect(onChange).toHaveBeenLastCalledWith(2000);
    expect(presetRadio('EUR 20')).toBeChecked();
  });

  it('selects the manual amount for a value that is not a preset', () => {
    renderPicker({ value: 1750 });

    expect(checkedValues()).toEqual(['0']);
    expect(manualInput()).toHaveValue('17.5');
  });

  it('reports the typed manual amount', async () => {
    const { user, onChange } = renderPicker();

    await user.clear(manualInput());
    await user.type(manualInput(), '42');

    expect(onChange).toHaveBeenLastCalledWith(4200);
    expect(checkedValues()).toEqual(['0']);
  });

  it('shows the minimum below the manual amount', () => {
    renderPicker();

    expect(screen.getByText('Min EUR 10.00')).toBeInTheDocument();
  });

  it('shows the amounts per period and reports the amount per month', async () => {
    const { user, onChange } = renderPicker({
      paymentPeriodicity: PaymentPeriodicity.Yearly,
      presetAmounts: [12000, 18000, 24000],
    });

    expect(presetRadio('EUR 180')).toBeChecked();
    expect(screen.getByText('Min EUR 120.00')).toBeInTheDocument();

    await user.click(presetRadio('EUR 240'));

    expect(onChange).toHaveBeenLastCalledWith(2000);
  });

  it('formats the preset amounts with the given format', () => {
    renderPicker({ format: '0.00' });

    expect(presetRadio('EUR 15.00')).toBeChecked();
  });

  describe('without manual amount', () => {
    it('only offers the preset amounts', () => {
      renderPicker({ showInput: false });

      expect(amountRadios()).toHaveLength(3);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('moves a custom amount to the nearest preset', () => {
      const { onChange } = renderPicker({ showInput: false, value: 1600 });

      expect(onChange).toHaveBeenCalledWith(1500);
      expect(presetRadio('EUR 15')).toBeChecked();
    });

    it('moves an amount below the minimum to the nearest preset above it', () => {
      const { onChange } = renderPicker({
        showInput: false,
        amountPerMonthMin: 1500,
        value: 1000,
      });

      expect(onChange).toHaveBeenCalledWith(1500);
    });

    it('keeps a preset amount that is above the minimum', () => {
      const { onChange } = renderPicker({ showInput: false, value: 2000 });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('without initial selection', () => {
    it('selects nothing until the reader picks an amount', async () => {
      const { user } = renderPicker({ noInitialSelection: true });

      expect(checkedValues()).toEqual([]);

      await user.click(presetRadio('EUR 10'));

      expect(checkedValues()).toEqual(['1000']);
    });
  });

  describe('with snapping', () => {
    it('snaps a typed amount close below a snap value up to it', async () => {
      const { user, onChange } = renderPicker({
        snap: { values: [50], threshold: 10 },
      });

      await user.clear(manualInput());
      await user.type(manualInput(), '45');
      await user.tab();

      expect(onChange).toHaveBeenLastCalledWith(5000);
    });

    it('keeps a typed amount that is far from every snap value', async () => {
      const { user, onChange } = renderPicker({
        snap: { values: [50], threshold: 10 },
      });

      await user.clear(manualInput());
      await user.type(manualInput(), '30');
      await user.tab();

      expect(onChange).toHaveBeenLastCalledWith(3000);
    });
  });
});
