import {
  type FullMemberPlanFragment,
  Currency,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { CurrencyField, fieldComponent } from '@wepublish/form/editor';
import { PAYMENT_PERIODICITY_MONTHS } from '@wepublish/ui/editor';
import { useWatch } from 'react-hook-form';

function PeriodAmount() {
  const memberPlan: FullMemberPlanFragment | null | undefined = useWatch({
    name: 'memberPlan',
  });
  const paymentPeriodicity: PaymentPeriodicity | null | undefined = useWatch({
    name: 'paymentPeriodicity',
  });

  return (
    <CurrencyField
      currency={memberPlan?.currency ?? Currency.Chf}
      scale={
        PAYMENT_PERIODICITY_MONTHS[
          paymentPeriodicity ?? PaymentPeriodicity.Yearly
        ]
      }
    />
  );
}

export const PeriodAmountField = fieldComponent<number | null>()(
  PeriodAmount
);
