import { InputAdornment, Slider } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency } from '@wepublish/website/api';
import { formatCurrency } from '../../formatters/format-currency';
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

    return (
      <PaymentAmountSliderWrapper className={className}>
        {!donate && (
          <Slider
            ref={ref}
            name={name}
            value={value}
            onChange={(_, val) => onChange(val as number)}
            min={amountPerMonthMin}
            max={amountPerMonthMax ?? amountPerMonthMin * 5}
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
            value={value / 100}
            onChange={event => onChange(+event.target.value * 100)}
            type={'number'}
            fullWidth
            inputProps={{
              step: 'any',
              min: amountPerMonthMin / 100,
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
