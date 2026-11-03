import {
  type CreateCrowdfundingInput,
  CrowdfundingGoalType,
  type FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import {
  formFields,
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const crowdfundingGoalSchema = z.object({
  title: z.string().min(1).meta({ label: 'crowdfunding.goalsForm.title' }),
  description: z
    .string()
    .nullish()
    .meta({ label: 'crowdfunding.goalsForm.description' }),
  amount: z
    .number()
    .int()
    .min(0)
    .default(0)
    .meta({ label: 'crowdfunding.goalsForm.amountSubscriptions' }),
});

export const crowdfundingSchema = z.object({
  name: z.string().min(1).meta({ label: 'crowdfunding.form.name' }),
  goalType: z
    .enum(CrowdfundingGoalType)
    .default(CrowdfundingGoalType.Subscription)
    .meta({
      label: 'crowdfunding.form.goalType',
      description: 'crowdfunding.form.goalTypeInfo',
      optionLabelPrefix: 'crowdfunding.form.goalTypes.',
    }),
  additionalRevenue: z.number().int().min(0).nullish().meta({
    label: 'crowdfunding.form.additionalSubscriptions',
    description: 'crowdfunding.form.additionalSubscriptionsInfo',
  }),
  memberPlans: formFields.memberPlans().meta({
    label: 'crowdfunding.form.memberPlans',
    description: 'crowdfunding.form.memberPlansInfo',
    placeholder: 'crowdfunding.form.selectMemberPlans',
  }),
  countSubscriptionsFrom: formFields
    .dateTime()
    .nullish()
    .meta({ label: 'crowdfunding.form.countSubscriptionsFrom' }),
  countSubscriptionsUntil: formFields
    .dateTime()
    .nullish()
    .meta({ label: 'crowdfunding.form.countSubscriptionsUntil' }),
  goals: z
    .array(crowdfundingGoalSchema)
    .meta({ label: 'crowdfunding.form.goals' }),
});

export type CrowdfundingFormValues = FormValues<typeof crowdfundingSchema>;

export type CrowdfundingFormOutput = FormOutput<typeof crowdfundingSchema>;

export const editTitleParams = ({ name }: CrowdfundingFormValues) => ({
  crowdfundingName: name || '…',
});

const dateOf = (value: string | null) => (value ? new Date(value) : null);

export const fromCrowdfunding = (
  crowdfunding: FullCrowdfundingFragment
): FormDefaultValues<typeof crowdfundingSchema> => ({
  name: crowdfunding.name,
  goalType: crowdfunding.goalType,
  additionalRevenue: crowdfunding.additionalRevenue,
  memberPlans: crowdfunding.memberPlans.map(({ id }) => id),
  countSubscriptionsFrom: dateOf(crowdfunding.countSubscriptionsFrom),
  countSubscriptionsUntil: dateOf(crowdfunding.countSubscriptionsUntil),
  goals: crowdfunding.goals.map(({ title, description, amount }) => ({
    title,
    description,
    amount,
  })),
});

export const toCrowdfundingInput = ({
  memberPlans,
  countSubscriptionsFrom,
  countSubscriptionsUntil,
  ...crowdfunding
}: CrowdfundingFormOutput): CreateCrowdfundingInput => ({
  ...crowdfunding,
  memberPlans: memberPlans.map(id => ({ id })),
  countSubscriptionsFrom: countSubscriptionsFrom?.toISOString() ?? null,
  countSubscriptionsUntil: countSubscriptionsUntil?.toISOString() ?? null,
});
