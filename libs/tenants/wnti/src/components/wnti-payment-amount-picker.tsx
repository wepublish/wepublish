import styled from '@emotion/styled';
import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const PaymentAmountPickerStyled = styled(PaymentAmountPicker)`
  grid-template-columns: repeat(auto-fit, 125px);
`;

export const WntiPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountPickerProps
>((props, ref) => {
  return (
    <PaymentAmountPickerStyled
      {...props}
      ref={ref}
      presetAmounts={
        props.presetAmounts ??
        (props.donate ? [10000, 15000, 20000] : [1000, 1500, 2000])
      }
      arrows={'stacked'}
      snap={{
        values: props.donate ? [100, 150, 200] : [10, 15, 20],
        threshold: 0.6,
      }}
    />
  );
});

WntiPaymentAmountPicker.displayName = 'WntiPaymentAmountPicker';
