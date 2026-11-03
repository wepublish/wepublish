import type {
  CreateDiscountCodeMutationVariables,
  FullDiscountCodeFragment,
  UpdateDiscountCodeMutationVariables,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  crossField,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const discountCodeFields = z.object({
  code: z.string().min(3).meta({
    label: 'discountCode.form.code',
    description: 'discountCode.form.codeInfo',
  }),
  discountPercent: z.int().min(0).max(100).default(0).meta({
    label: 'discountCode.form.discountPercent',
    description: 'discountCode.form.discountPercentInfo',
  }),
  memberPlanId: formFields.memberPlan().meta({
    label: 'discountCode.form.memberPlan',
    description: 'discountCode.form.memberPlanInfo',
  }),
  validFrom: formFields
    .dateTime()
    .meta({ label: 'discountCode.form.validFrom' }),
  validTo: formFields.dateTime().meta({ label: 'discountCode.form.validTo' }),
});

export const discountCodeSchema = crossField(
  discountCodeFields,
  ['validFrom', 'validTo'],
  ({ validFrom, validTo }) => validTo >= validFrom,
  { path: ['validTo'], error: 'discountCode.form.validToBeforeValidFrom' }
);

export const upperCaseCode = (code: string) => code.toUpperCase();

export const discountCodeTitleParams = ({
  code,
}: FormValues<typeof discountCodeSchema>) => ({
  discountCode: code || '…',
});

export const fromDiscountCode = (
  discountCode: FullDiscountCodeFragment
): FormDefaultValues<typeof discountCodeSchema> => ({
  code: upperCaseCode(discountCode.code),
  discountPercent: discountCode.discountPercent,
  memberPlanId: discountCode.memberPlanId,
  validFrom: new Date(discountCode.validFrom),
  validTo: new Date(discountCode.validTo),
});

type DiscountCodeOutput = FormOutput<typeof discountCodeSchema>;

export const toCreateDiscountCodeVariables = ({
  code,
  discountPercent,
  memberPlanId,
  validFrom,
  validTo,
}: DiscountCodeOutput): CreateDiscountCodeMutationVariables => ({
  code: code.toLowerCase(),
  discountPercent,
  memberPlanId,
  validFrom: validFrom.toISOString(),
  validTo: validTo.toISOString(),
});

export const toUpdateDiscountCodeVariables = (
  id: string,
  values: DiscountCodeOutput
): UpdateDiscountCodeMutationVariables => ({
  id,
  ...toCreateDiscountCodeVariables(values),
});
