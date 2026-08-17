import styled from '@emotion/styled';
import {
  PaymentAmountPicker,
  StyledCurrencyNumberSpinner,
} from '@wepublish/membership/website';
import { BuilderPaymentAmountPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const PaymentAmountPickerStyled = styled(PaymentAmountPicker)`
  ${StyledCurrencyNumberSpinner} {
    input {
      font-weight: 600;
      color: ${({ theme }) => theme.palette.text.primary};
    }
  }
`;

export const GanzGrazPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountPickerProps
>((props, ref) => (
  <PaymentAmountPickerStyled
    {...props}
    ref={ref}
    presetAmounts={props.presetAmounts ?? [550, 1200, 2500]}
    format={'0.00'}
    snap={{
      values: [5.5, 12, 25],
      threshold: 0.6,
    }}
  />
));

GanzGrazPaymentAmountPicker.displayName = 'GanzGrazPaymentAmountPicker';
