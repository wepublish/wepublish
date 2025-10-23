import styled from '@emotion/styled';
import {
  FormControlLabel,
  InputAdornment as InputAdornmentDefault,
  RadioGroup,
} from '@mui/material';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { ChangeEvent, forwardRef } from 'react';

import { FieldNumberSpinner } from './number-input/field-number-spinner';

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

const PaymentAmountInput = styled(FieldNumberSpinner)`
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
  typeof FieldNumberSpinner,
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
              startAdornment={
                <InputAdornment position="start">CHF</InputAdornment>
              }
              value={(value as number) ? (value as number) / 100 : 0}
              onChange={(param: number | ChangeEvent | undefined) => {
                if (typeof param === 'number') {
                  onChange(param ? param * 100 : 0);
                } else if (param && 'target' in param) {
                  const newValue = parseInt(
                    (param.target as HTMLInputElement).value
                  );
                  onChange(newValue ? newValue * 100 : 0);
                }
              }}
              inputProps={{
                'aria-label': 'weight',
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
