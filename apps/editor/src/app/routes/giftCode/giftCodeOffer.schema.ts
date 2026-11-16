import {
  type CreateGiftCodeOfferMutationVariables,
  type FullGiftCodeOfferFragment,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  crossField,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const giftCodeOfferFields = z.object({
  name: z.string().trim().min(1).meta({ label: 'giftCodeOffer.form.name' }),
  description: formFields
    .richText()
    .nullish()
    .meta({ label: 'giftCodeOffer.form.description' }),
  image: formFields
    .image()
    .nullish()
    .meta({ label: 'giftCodeOffer.form.image' }),
  active: z
    .boolean()
    .default(true)
    .meta({ label: 'giftCodeOffer.form.active' }),
  memberPlanId: formFields
    .memberPlan()
    .meta({ label: 'giftCodeOffer.form.memberPlan' }),
  periodicity: z.enum(PaymentPeriodicity).meta({
    label: 'giftCodeOffer.form.periodicity',
    helperText: 'giftCodeOffer.form.periodicityHelp',
    optionLabelPrefix: 'memberPlanList.paymentPeriodicity.',
  }),
  redemptionWindowMonths: z
    .int({ error: 'giftCodeOffer.form.redemptionWindowMonthsInvalid' })
    .min(1, { error: 'giftCodeOffer.form.redemptionWindowMonthsInvalid' })
    .nullish()
    .meta({
      label: 'giftCodeOffer.form.redemptionWindowMonths',
      helperText: 'giftCodeOffer.form.redemptionWindowMonthsHelp',
      placeholder: 'giftCodeOffer.overview.unlimited',
    }),
  price: z
    .int({ error: 'giftCodeOffer.form.priceInvalid' })
    .min(1, { error: 'giftCodeOffer.form.priceInvalid' })
    .meta({ label: 'giftCodeOffer.form.price' }),
  paymentMethodIds: z
    .array(z.string())
    .min(1, { error: 'giftCodeOffer.form.paymentMethodsRequired' })
    .meta({
      label: 'giftCodeOffer.form.paymentMethods',
      helperText: 'giftCodeOffer.form.paymentMethodsHelp',
    }),
  allowDiscountCodes: z.boolean().meta({
    label: 'giftCodeOffer.form.allowDiscountCodes',
    helperText: 'giftCodeOffer.form.allowDiscountCodesHelp',
  }),
  autoRenew: z.boolean().meta({ label: 'giftCodeOffer.form.autoRenew' }),
  renewalPaymentMethodId: z.string().nullish().meta({
    label: 'giftCodeOffer.form.renewalPaymentMethod',
    helperText: 'giftCodeOffer.form.renewalPaymentMethodHelp',
  }),
});

export const giftCodeOfferSchema = crossField(
  giftCodeOfferFields,
  ['autoRenew', 'renewalPaymentMethodId'],
  ({ autoRenew, renewalPaymentMethodId }) =>
    !autoRenew || Boolean(renewalPaymentMethodId),
  {
    path: ['renewalPaymentMethodId'],
    error: 'giftCodeOffer.form.renewalPaymentMethodRequired',
  }
);

export type GiftCodeOfferFormValues = FormValues<typeof giftCodeOfferSchema>;

export const giftCodeOfferTitleParams = ({
  name,
}: GiftCodeOfferFormValues) => ({
  offer: name || '…',
});

export const fromGiftCodeOffer = (
  offer: FullGiftCodeOfferFragment
): FormDefaultValues<typeof giftCodeOfferSchema> => ({
  name: offer.name,
  description: offer.description,
  image: offer.image,
  active: offer.active,
  memberPlanId: offer.memberPlanId,
  periodicity: offer.periodicity,
  redemptionWindowMonths: offer.redemptionWindowMonths,
  paymentMethodIds: offer.paymentMethodIds,
  price: offer.price,
  allowDiscountCodes: offer.allowDiscountCodes,
  autoRenew: offer.autoRenew,
  renewalPaymentMethodId: offer.renewalPaymentMethodId ?? null,
});

export const toGiftCodeOfferVariables = ({
  name,
  description,
  image,
  active,
  memberPlanId,
  periodicity,
  redemptionWindowMonths,
  paymentMethodIds,
  price,
  allowDiscountCodes,
  autoRenew,
  renewalPaymentMethodId,
}: FormOutput<
  typeof giftCodeOfferSchema
>): CreateGiftCodeOfferMutationVariables => ({
  name,
  description: description ?? null,
  active,
  allowDiscountCodes,
  memberPlanId,
  periodicity,
  redemptionWindowMonths: redemptionWindowMonths ?? null,
  price,
  imageID: image?.id ?? null,
  paymentMethodIds,
  autoRenew,
  renewalPaymentMethodId: (autoRenew && renewalPaymentMethodId) || null,
});
