import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderPaymentAmountSliderProps } from '@wepublish/website/builder';
import { useState } from 'react';
import { PaymentAmountSlider } from './payment-amount-slider';

const ControlledPaymentAmountSlider = (
  props: BuilderPaymentAmountSliderProps
) => {
  const [value, setValue] = useState(props.value);

  return (
    <PaymentAmountSlider
      {...props}
      value={value}
      onChange={amount => {
        props.onChange(amount);
        setValue(amount);
      }}
    />
  );
};

const renderSlider = (props: Partial<BuilderPaymentAmountSliderProps> = {}) => {
  const onChange = vi.fn();

  renderWithProviders(
    <ControlledPaymentAmountSlider
      amountPerMonthMin={1000}
      amountPerMonthMax={5000}
      amountPerMonthTarget={1500}
      currency={Currency.Chf}
      value={1500}
      donate={false}
      error={undefined}
      {...props}
      onChange={onChange}
    />
  );

  return { onChange, user: userEvent.setup() };
};

describe('PaymentAmountSlider', () => {
  it('limits the slider to the monthly minimum and maximum', () => {
    renderSlider();

    const slider = screen.getByRole('slider');

    expect(slider).toHaveAttribute('aria-valuemin', '1000');
    expect(slider).toHaveAttribute('aria-valuemax', '5000');
    expect(slider).toHaveAttribute('aria-valuenow', '1500');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('allows up to five times the minimum when there is no maximum', () => {
    renderSlider({
      amountPerMonthMin: 2000,
      amountPerMonthMax: undefined,
      value: 2000,
    });

    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuemax',
      '10000'
    );
  });

  it('reports the slid amount', () => {
    const { onChange } = renderSlider();

    fireEvent.change(screen.getByRole('slider'), { target: { value: 2500 } });

    expect(onChange).toHaveBeenLastCalledWith(2500);
  });

  it('shows the amount per period and reports it per month', () => {
    const { onChange } = renderSlider({
      paymentPeriodicity: PaymentPeriodicity.Yearly,
    });

    const slider = screen.getByRole('slider');

    expect(slider).toHaveAttribute('aria-valuemin', '12000');
    expect(slider).toHaveAttribute('aria-valuemax', '60000');
    expect(slider).toHaveAttribute('aria-valuenow', '18000');

    fireEvent.change(slider, { target: { value: 24000 } });

    expect(onChange).toHaveBeenLastCalledWith(2000);
  });

  it('moves the slider when the reader types an amount', async () => {
    const { user, onChange } = renderSlider({ showInput: true });
    const input = screen.getByRole('spinbutton');

    expect(input).toHaveValue(15);

    await user.clear(input);
    await user.type(input, '25');

    expect(onChange).toHaveBeenLastCalledWith(2500);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '2500');
  });

  it('shows the currency next to the input', () => {
    renderSlider({ showInput: true, currency: Currency.Eur });

    expect(screen.getByText(Currency.Eur)).toBeInTheDocument();
  });

  it('only offers the input for donations', () => {
    renderSlider({ donate: true, showInput: true });

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(15);
  });
});
