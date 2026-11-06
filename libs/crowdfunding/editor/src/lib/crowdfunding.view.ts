import { CrowdfundingGoalType } from '@wepublish/editor/api';
import { bindComponent, formView } from '@wepublish/form/editor';

import { CrowdfundingAmountField } from './crowdfunding-amount-field';
import { CrowdfundingGoalRow } from './crowdfunding-goal-row';
import { CrowdfundingProgress } from './crowdfunding-progress';
import {
  type CrowdfundingFormValues,
  crowdfundingSchema,
} from './crowdfunding.schema';

const amount = bindComponent(CrowdfundingAmountField);

const additionalAmount = {
  [CrowdfundingGoalType.Revenue]: {
    label: 'crowdfunding.form.additionalRevenue',
    description: 'crowdfunding.form.additionalRevenueInfo',
  },
  [CrowdfundingGoalType.Subscription]: {
    label: 'crowdfunding.form.additionalSubscriptions',
    description: 'crowdfunding.form.additionalSubscriptionsInfo',
  },
};

const goalAmount = {
  [CrowdfundingGoalType.Revenue]: { label: 'crowdfunding.goalsForm.amount' },
  [CrowdfundingGoalType.Subscription]: {
    label: 'crowdfunding.goalsForm.amountSubscriptions',
  },
};

const goalTypeOf = ({ goalType }: CrowdfundingFormValues) =>
  goalType ?? CrowdfundingGoalType.Subscription;

export const crowdfundingView = formView(crowdfundingSchema, {
  paths: {
    list: '/crowdfundings',
    edit: id => `/crowdfundings/edit/${id}`,
  },
  sections: [
    {
      title: 'crowdfunding.form.crowdfunding',
      fields: ['name', 'goalType', 'additionalRevenue'],
    },
    {
      title: 'crowdfunding.form.filter',
      fields: [
        'memberPlans',
        'countSubscriptionsFrom',
        'countSubscriptionsUntil',
      ],
    },
    {
      title: 'crowdfunding.form.goals',
      description: 'crowdfunding.form.goalsInfo',
      fields: ['goals'],
    },
    {
      title: 'crowdfunding.form.progress',
      placement: 'aside',
      modes: ['edit'],
      component: CrowdfundingProgress,
    },
  ],
  fields: {
    additionalRevenue: {
      component: amount,
      label: values => additionalAmount[goalTypeOf(values)].label,
      description: values => additionalAmount[goalTypeOf(values)].description,
    },
    goals: { props: { addLabel: 'crowdfunding.goalsForm.add' } },
    'goals.*': { layout: CrowdfundingGoalRow },
    'goals.*.amount': {
      component: amount,
      label: values => goalAmount[goalTypeOf(values)].label,
    },
  },
});
