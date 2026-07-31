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
  const isDonate = props.slug?.includes('donate');

  return (
    <PaymentAmountPickerStyled
      {...props}
      ref={ref}
      presetAmounts={
        props.presetAmounts ??
        (isDonate ? [10000, 15000, 20000] : [1000, 1500, 2000])
      }
      arrows={'stacked'}
      snap={{
        values: isDonate ? [100, 150, 200] : [10, 15, 20],
        threshold: 0.6,
      }}
    />
  );
});

WntiPaymentAmountPicker.displayName = 'WntiPaymentAmountPicker';
