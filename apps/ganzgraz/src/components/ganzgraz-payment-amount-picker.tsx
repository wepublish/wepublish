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
    pickerItems={[550, 1200, 2500]}
  />
));

GanzGrazPaymentAmountPicker.displayName = 'GanzGrazPaymentAmountPicker';
