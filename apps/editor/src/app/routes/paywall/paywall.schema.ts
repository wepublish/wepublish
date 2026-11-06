import type {
  CreatePaywallMutationVariables,
  FullPaywallFragment,
  UpdatePaywallMutationVariables,
} from '@wepublish/editor/api';
import { type FormDefaultValues, formFields } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const paywallSchema = z.object({
  name: z.string().trim().min(1).meta({ label: 'paywall.form.name' }),
  active: z.boolean().default(true).meta({
    label: 'paywall.form.active',
    helperText: 'paywall.form.activeHelpText',
  }),
  description: formFields
    .richText()
    .nullish()
    .meta({ label: 'paywall.form.description' }),
  circumventDescription: formFields
    .richText()
    .nullish()
    .meta({ label: 'paywall.form.circumventDescription' }),
  upgradeDescription: formFields
    .richText()
    .nullish()
    .meta({ label: 'paywall.form.upgradeDescription' }),
  upgradeCircumventDescription: formFields
    .richText()
    .nullish()
    .meta({ label: 'paywall.form.upgradeCircumventDescription' }),
  anyMemberPlan: z
    .boolean()
    .default(false)
    .meta({ label: 'paywall.form.anyMemberPlan' }),
  memberPlanIds: formFields
    .memberPlans()
    .meta({ label: 'paywall.form.memberPlans' }),
  alternativeSubscribeUrl: z.url().or(z.literal('')).nullish().meta({
    label: 'paywall.form.alternativeSubscribeUrl',
    helperText: 'paywall.form.alternativeSubscribeUrlHelpText',
  }),
  hideContentAfter: z.int().min(0).default(3).meta({
    label: 'paywall.form.hideContentAfter',
    description: 'paywall.form.hideContentAfterInfo',
  }),
  fadeout: z.boolean().default(true).meta({
    label: 'paywall.form.fadeout',
    helperText: 'paywall.form.fadeoutHelpText',
  }),
  bypassTokens: z
    .array(
      z.object({
        token: z
          .string()
          .trim()
          .min(1)
          .meta({ label: 'paywall.form.bypassToken' }),
      })
    )
    .meta({ label: 'paywall.form.bypasses' }),
});

export type PaywallFormOutput = z.output<typeof paywallSchema>;

export const fromPaywall = (
  paywall: FullPaywallFragment
): FormDefaultValues<typeof paywallSchema> => ({
  name: paywall.name ?? '',
  active: paywall.active,
  description: paywall.description,
  circumventDescription: paywall.circumventDescription,
  upgradeDescription: paywall.upgradeDescription,
  upgradeCircumventDescription: paywall.upgradeCircumventDescription,
  anyMemberPlan: paywall.anyMemberPlan,
  memberPlanIds: paywall.memberPlans.map(plan => plan.id),
  alternativeSubscribeUrl: paywall.alternativeSubscribeUrl,
  hideContentAfter: paywall.hideContentAfter,
  fadeout: paywall.fadeout,
  bypassTokens: paywall.bypasses.map(({ token }) => ({ token })),
});

const toPaywallInput = (
  values: PaywallFormOutput
): CreatePaywallMutationVariables => ({
  name: values.name,
  description: values.description ?? null,
  circumventDescription: values.circumventDescription ?? null,
  upgradeDescription: values.upgradeDescription ?? null,
  upgradeCircumventDescription: values.upgradeCircumventDescription ?? null,
  active: values.active,
  anyMemberPlan: values.anyMemberPlan,
  memberPlanIds: values.memberPlanIds,
  alternativeSubscribeUrl: values.alternativeSubscribeUrl || null,
  hideContentAfter: values.hideContentAfter,
  fadeout: values.fadeout,
  bypassTokens: [...new Set(values.bypassTokens.map(({ token }) => token))],
});

export const toCreatePaywallVariables = (
  values: PaywallFormOutput
): CreatePaywallMutationVariables => toPaywallInput(values);

export const toUpdatePaywallVariables = (
  id: string,
  values: PaywallFormOutput
): UpdatePaywallMutationVariables => ({
  id,
  ...toPaywallInput(values),
});
