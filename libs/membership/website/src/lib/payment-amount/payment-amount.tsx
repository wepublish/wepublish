import { forwardRef } from 'react';
import { BuilderPaymentAmountProps } from '@wepublish/website/builder';
import { AmountSelectionLayout } from '@wepublish/website/api';
import { PaymentAmountPicker } from './payment-amount-picker/payment-amount-picker';
import { PaymentAmountSlider } from './payment-amount-slider/payment-amount-slider';

export const PaymentAmount = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>(function PaymentAmount({ amountSelectionLayout, ...props }, ref) {
  if (amountSelectionLayout === AmountSelectionLayout.Picker) {
    return (
      <PaymentAmountPicker
        ref={ref}
        {...props}
      />
    );
  }

  return (
    <PaymentAmountSlider
      ref={ref}
      {...props}
    />
  );
});
