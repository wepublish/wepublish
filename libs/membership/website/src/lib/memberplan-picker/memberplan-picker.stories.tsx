import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { Currency, FullMemberPlanFragment } from '@wepublish/website/api';
import { useState } from 'react';
import { MemberPlanPicker } from './memberplan-picker';
import { ApolloError } from '@apollo/client';
import { mockMemberPlan } from '@wepublish/storybook/mocks';

export default {
  component: MemberPlanPicker,
  title: 'Components/MemberPlanPicker',
  render: function ControlledMemberPlanPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <MemberPlanPicker
        {...args}
        value={value}
        onChange={memberPlanId => {
          args.onChange(memberPlanId);
          setValue(memberPlanId);
        }}
      />
    );
  },
} as Meta<typeof MemberPlanPicker>;

const memberPlan = mockMemberPlan() as FullMemberPlanFragment;

export const Default: StoryObj<typeof MemberPlanPicker> = {
  args: {
    memberPlans: [
      memberPlan,
      { ...memberPlan, id: '2', currency: Currency.Eur },
      { ...memberPlan, id: '3', extendable: false },
    ],
    onChange: action('onChange'),
  },
};

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: memberPlan.id,
  },
};

export const Single: StoryObj<typeof MemberPlanPicker> = {
  ...Default,
  args: {
    ...Default.args,
    memberPlans: [memberPlan],
  },
};

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    loading: true,
  },
};

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};
