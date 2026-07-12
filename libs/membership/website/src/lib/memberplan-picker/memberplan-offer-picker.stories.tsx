import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { useState } from 'react';
import { MemberPlanOfferPicker } from './memberplan-offer-picker';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
} from '@wepublish/storybook/mocks';

export default {
  component: MemberPlanOfferPicker,
  title: 'Components/MemberPlanOfferPicker',
  render: function ControlledMemberPlanOfferPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <MemberPlanOfferPicker
        {...args}
        value={value}
        onChange={offer => {
          args.onChange(offer);
          setValue(offer);
        }}
      />
    );
  },
} as Meta<typeof MemberPlanOfferPicker>;

const memberPlan = mockMemberPlan({
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Yearly,
      ],
    }),
  ],
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.Yearly,
      label: '2 Monate geschenkt',
      amountMin: 5000,
      amountTarget: 6000,
      amountMax: null,
    },
  ],
}) as FullMemberPlanFragment;

const singlePeriodicityMemberPlan = mockMemberPlan({
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      paymentPeriodicities: [PaymentPeriodicity.Yearly],
    }),
  ],
}) as FullMemberPlanFragment;

export const Default: StoryObj<typeof MemberPlanOfferPicker> = {
  args: {
    memberPlans: [memberPlan],
    onChange: action('onChange'),
  },
};

export const MultiplePlans: StoryObj<typeof MemberPlanOfferPicker> = {
  args: {
    memberPlans: [memberPlan, { ...singlePeriodicityMemberPlan, id: '2' }],
    onChange: action('onChange'),
  },
};

export const Preselected: StoryObj<typeof MemberPlanOfferPicker> = {
  args: {
    memberPlans: [memberPlan],
    value: {
      memberPlanId: memberPlan.id,
      paymentPeriodicity: PaymentPeriodicity.Yearly,
    },
    onChange: action('onChange'),
  },
};
