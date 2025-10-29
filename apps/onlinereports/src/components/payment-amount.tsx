import { NumberField } from '@base-ui-components/react/number-field';
import styled from '@emotion/styled';
import {
  FormControlLabel,
  InputAdornment as InputAdornmentDefault,
  RadioGroup,
} from '@mui/material';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

import { CurrencyNumberSpinner } from './currency-number-spinner';

export const PaymentAmountPickerWrapper = styled(RadioGroup)`
  display: grid;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`;

const PaymentAmountInput = styled(CurrencyNumberSpinner)`
  background: #fff;
  // Chrome, Safari, Edge

  & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

,
  // Firefox
& input [ type = number ] {
  -moz-appearance: textfield;
},

`;

const InputAdornment = styled(InputAdornmentDefault)`
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

export const OnlineReportsPaymentAmount = forwardRef<
  typeof CurrencyNumberSpinner,
  BuilderPaymentAmountProps
>(
  (
    {
      className,
      slug,
      currency,
      amountPerMonthMin,
      amountPerMonthTarget,
      name,
      error,
      value,
      onChange,
    },
    ref
  ) => {
    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        onChange={event => {
          if (+event.target.value) {
            onChange(+event.target.value);
          }
        }}
        value={value}
      >
        <FormControlLabel
          sx={{ width: '236px' }}
          value={''}
          control={
            <PaymentAmountInput
              onValueChange={(
                value: number | null,
                eventDetails: NumberField.Root.ChangeEventDetails
              ) => {
                if (typeof value === 'number' && value >= 0) {
                  onChange(value ? value * 100 : 0);
                } else {
                  onChange(0);
                }
              }}
            />
          }
          label={'Manuell'}
        />
      </PaymentAmountPickerWrapper>
    );
  }
);

OnlineReportsPaymentAmount.displayName = 'OnlineReportsPaymentAmount';
