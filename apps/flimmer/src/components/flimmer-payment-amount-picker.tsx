import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountPickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const FlimmerPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountPickerProps
>((props, ref) => (
  <PaymentAmountPicker
    {...props}
    ref={ref}
    presetAmounts={props.presetAmounts ?? [1000, 1500, 2000]}
  />
));

FlimmerPaymentAmountPicker.displayName = 'FlimmerPaymentAmountPicker';
