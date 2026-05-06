import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const GanzGrazPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>((props, ref) => (
  <PaymentAmountPicker
    {...props}
    ref={ref}
    pickerItems={[1000, 1500, 2000]}
  />
));

GanzGrazPaymentAmountPicker.displayName = 'GanzGrazPaymentAmountPicker';
