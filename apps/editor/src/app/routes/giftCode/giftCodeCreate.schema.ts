import type { CreateGiftCodesMutationVariables } from '@wepublish/editor/api';
import type { FormOutput } from '@wepublish/form/editor';
import { z } from 'zod/v4';

const MAX_COUNT = 500;
const RECIPIENT_NAME_MAX_LENGTH = 200;

export const giftCodeCreateSchema = z.object({
  offerId: z
    .string()
    .min(1, { error: 'giftCode.create.offerRequired' })
    .meta({ label: 'giftCode.create.offer' }),
  count: z
    .int({ error: 'giftCode.create.countInvalid' })
    .min(1, { error: 'giftCode.create.countInvalid' })
    .max(MAX_COUNT, { error: 'giftCode.create.countInvalid' })
    .default(1)
    .meta({
      label: 'giftCode.create.count',
      helperText: 'giftCode.create.countHelp',
    }),
  recipientName: z
    .string()
    .max(RECIPIENT_NAME_MAX_LENGTH, {
      error: 'giftCode.create.recipientNameTooLong',
    })
    .meta({
      label: 'giftCode.create.recipientName',
      helperText: 'giftCode.create.recipientNameHelp',
    }),
});

export const toCreateGiftCodesVariables = ({
  offerId,
  count,
  recipientName,
}: FormOutput<
  typeof giftCodeCreateSchema
>): CreateGiftCodesMutationVariables => ({
  offerId,
  count,
  recipientName: recipientName.trim() || null,
});
