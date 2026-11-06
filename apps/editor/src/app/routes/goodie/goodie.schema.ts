import {
  type CreateGoodieMutationVariables,
  type FullGoodieFragment,
  type UpdateGoodieMutationVariables,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const goodieSchema = z.object({
  name: z.string().min(1).meta({ label: 'goodie.form.name' }),
  description: formFields
    .richText()
    .nullish()
    .meta({ label: 'goodie.form.description' }),
  active: z.boolean().default(true).meta({
    label: 'goodie.form.active',
    description: 'goodie.form.activeInfo',
  }),
  memberPlanIDs: formFields.memberPlans().meta({
    label: 'goodie.form.memberPlans',
    description: 'goodie.form.memberPlansInfo',
  }),
  paymentPeriodicities: z.array(z.enum(PaymentPeriodicity)).meta({
    label: 'goodie.form.paymentPeriodicities',
    description: 'goodie.form.paymentPeriodicitiesInfo',
    optionLabelPrefix: 'memberPlanList.paymentPeriodicity.',
  }),
  stock: z.int().min(0).nullish().meta({
    label: 'goodie.form.stock',
    description: 'goodie.form.stockInfo',
    placeholder: 'goodie.overview.unlimited',
  }),
  image: formFields.image().nullish().meta({ label: 'goodie.form.image' }),
});

export const goodieTitleParams = ({
  name,
}: FormValues<typeof goodieSchema>) => ({
  goodie: name || '…',
});

export const fromGoodie = (
  goodie: FullGoodieFragment
): FormDefaultValues<typeof goodieSchema> => ({
  name: goodie.name,
  description: goodie.description,
  active: goodie.active,
  memberPlanIDs: goodie.memberPlans.map(plan => plan.id),
  paymentPeriodicities: goodie.paymentPeriodicities,
  stock: goodie.stock,
  image: goodie.image,
});

export const toCreateGoodieVariables = ({
  name,
  description,
  active,
  memberPlanIDs,
  paymentPeriodicities,
  stock,
  image,
}: FormOutput<typeof goodieSchema>): CreateGoodieMutationVariables => ({
  name,
  description: description ?? null,
  stock: stock ?? null,
  active,
  imageID: image?.id ?? null,
  memberPlanIDs,
  paymentPeriodicities,
});

export const toUpdateGoodieVariables = (
  id: string,
  values: FormOutput<typeof goodieSchema>
): UpdateGoodieMutationVariables => ({
  id,
  ...toCreateGoodieVariables(values),
});
