import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const TsriPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>((props, ref) => (
  <PaymentAmountPicker
    {...props}
    ref={ref}
    pickerItems={[1000, 1500, 2000]}
    arrows={'stacked'}
    snap={{
      values: [10, 15, 20],
      threshold: 0.6,
    }}
  />
));

TsriPaymentAmountPicker.displayName = 'TsriPaymentAmountPicker';
