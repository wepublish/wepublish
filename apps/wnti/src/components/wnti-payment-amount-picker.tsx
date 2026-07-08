import { PaymentAmountPicker } from '@wepublish/membership/website';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

export const WntiPaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>((props, ref) => {
  const isDonate = props.slug?.includes('donate');

  return (
    <PaymentAmountPicker
      {...props}
      ref={ref}
      pickerItems={isDonate ? [10000, 15000, 20000] : [1000, 1500, 2000]}
      arrows={'stacked'}
      snap={{
        values: isDonate ? [100, 150, 200] : [10, 15, 20],
        threshold: 0.6,
      }}
    />
  );
});

WntiPaymentAmountPicker.displayName = 'WntiPaymentAmountPicker';
