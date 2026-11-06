import { CrowdfundingGoalType } from '@wepublish/editor/api';
import {
  CurrencyField,
  fieldComponent,
  NumberField,
} from '@wepublish/form/editor';
import { useWatch } from 'react-hook-form';

import type { CrowdfundingFormValues } from './crowdfunding.schema';

function GoalTypeAmount() {
  const goalType = useWatch<CrowdfundingFormValues, 'goalType'>({
    name: 'goalType',
  });

  if (goalType === CrowdfundingGoalType.Revenue) {
    return <CurrencyField currency="CHF" />;
  }

  return <NumberField />;
}

export const CrowdfundingAmountField = fieldComponent<number | null>()(
  GoalTypeAmount
);
