import type {
  CreatePaymentMethodMutationVariables,
  FullPaymentMethodFragment,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const paymentMethodSchema = z.object({
  name: z.string().min(1).meta({ label: 'paymentMethodList.name' }),
  slug: z.string().meta({
    label: 'paymentMethodList.slug',
    description: 'paymentMethodList.slugInfo',
  }),
  description: z.string().meta({ label: 'paymentMethodList.description' }),
  active: z.boolean().default(true).meta({
    label: 'paymentMethodList.active',
    description: 'paymentMethodList.activeDescription',
  }),
  paymentProviderID: z.string().min(1).meta({
    label: 'paymentMethodList.adapter',
    description: 'paymentMethodList.adapterInfo',
  }),
  gracePeriod: z.int().min(0).default(0).meta({
    label: 'paymentMethodEditPanel.gracePeriod',
    helperText: 'paymentMethodEditPanel.gracePeriodHelpText',
  }),
  image: formFields
    .image()
    .nullish()
    .meta({ label: 'paymentMethodList.image' }),
});

export const fromPaymentMethod = ({
  name,
  slug,
  description,
  active,
  paymentProvider,
  gracePeriod,
  image,
}: FullPaymentMethodFragment): FormDefaultValues<
  typeof paymentMethodSchema
> => ({
  name,
  slug,
  description,
  active,
  paymentProviderID: paymentProvider?.id ?? '',
  gracePeriod,
  image: image ?? null,
});

export const toPaymentMethodVariables = ({
  name,
  slug,
  description,
  active,
  paymentProviderID,
  gracePeriod,
  image,
}: FormOutput<
  typeof paymentMethodSchema
>): CreatePaymentMethodMutationVariables => ({
  name,
  slug,
  description,
  active,
  paymentProviderID,
  gracePeriod,
  imageId: image?.id ?? null,
});
