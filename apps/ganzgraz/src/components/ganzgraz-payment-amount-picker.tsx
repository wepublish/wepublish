import styled from '@emotion/styled';
import {
  PaymentAmountPicker,
  StyledCurrencyNumberSpinner,
} from '@wepublish/membership/website';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const PaymentAmountPickerStyled = styled(PaymentAmountPicker)`
  grid-template-columns: repeat(auto-fit, 185px);

  ${StyledCurrencyNumberSpinner} {
    input {
      font-weight: 600;
      color: ${({ theme }) => theme.palette.text.primary};
    }
  }
`;

export const GanzGrazPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>((props, ref) => (
  <PaymentAmountPickerStyled
    {...props}
    ref={ref}
    pickerItems={[550, 1200, 2500]}
    format={'0.00'}
    spinner={true}
    noInitialSelection
    snap={{
      values: [5.5, 12, 25],
      threshold: 0.6,
    }}
  />
));

GanzGrazPaymentAmountPicker.displayName = 'GanzGrazPaymentAmountPicker';
