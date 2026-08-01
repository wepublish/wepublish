import styled from '@emotion/styled';
import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const PaymentAmountPickerStyled = styled(PaymentAmountPicker)`
  grid-template-columns: repeat(auto-fit, 125px);
`;

export const TsriPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountPickerProps
>((props, ref) => (
  <PaymentAmountPickerStyled
    {...props}
    ref={ref}
    presetAmounts={props.presetAmounts ?? [1000, 1500, 2000]}
    arrows={'stacked'}
    snap={{
      values: [10, 15, 20],
      threshold: 0.6,
    }}
  />
));

TsriPaymentAmountPicker.displayName = 'TsriPaymentAmountPicker';
