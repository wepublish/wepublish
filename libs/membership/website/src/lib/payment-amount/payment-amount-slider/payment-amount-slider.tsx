import { InputAdornment, Slider } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';
import { formatCurrency } from '../../formatters/format-currency';
import {
  calculatePeriodAmount,
  monthlyAmountFromPeriodAmount,
} from '../../formatters/format-payment-period';
import { forwardRef } from 'react';

export const PaymentAmountSliderWrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: center;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-auto-flow: column;
    grid-auto-columns: 300px;
  }
`;

export const PaymentAmountSlider = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>(
  (
    {
      className,
      currency,
      amountPerMonthMin,
      amountPerMonthMax,
      paymentPeriodicity = PaymentPeriodicity.Monthly,
      donate,
      name,
      value,
      onChange,
    },
    ref
  ) => {
    const {
      elements: { TextField },
      meta: { locale },
    } = useWebsiteBuilder();

    const periodValue = calculatePeriodAmount(value, paymentPeriodicity);
    const periodMin = calculatePeriodAmount(
      amountPerMonthMin,
      paymentPeriodicity
    );
    const periodMax =
      amountPerMonthMax != null ?
        calculatePeriodAmount(amountPerMonthMax, paymentPeriodicity)
      : periodMin * 5;

    const handlePeriodAmountChange = (periodAmount: number) =>
      onChange(
        monthlyAmountFromPeriodAmount(
          Math.round(periodAmount),
          paymentPeriodicity
        )
      );

    return (
      <PaymentAmountSliderWrapper className={className}>
        {!donate && (
          <Slider
            ref={ref}
            name={name}
            value={periodValue}
            onChange={(_, val) => handlePeriodAmountChange(val as number)}
            min={periodMin}
            max={periodMax}
            valueLabelFormat={val =>
              formatCurrency(val / 100, currency ?? Currency.Chf, locale)
            }
            step={100}
            color="secondary"
          />
        )}

        {donate && (
          <TextField
            name={name}
            value={Math.round(periodValue) / 100}
            onChange={event =>
              handlePeriodAmountChange(Math.round(+event.target.value * 100))
            }
            type={'number'}
            fullWidth
            inputProps={{
              step: 'any',
              min: periodMin / 100,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {currency ?? Currency.Chf}
                </InputAdornment>
              ),
            }}
          />
        )}
      </PaymentAmountSliderWrapper>
    );
  }
);
