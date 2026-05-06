import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const WntiPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>((props, ref) => (
  <PaymentAmountPicker
    {...props}
    ref={ref}
    pickerItems={
      props.slug?.includes('donate') ?
        [10000, 15000, 20000]
      : [1000, 1500, 2000]
    }
  />
));

WntiPaymentAmountPicker.displayName = 'WntiPaymentAmountPicker';
