import { z } from 'zod/v4';

export const consentSchema = z.object({
  name: z.string().min(1).meta({ label: 'consents.name' }),
  slug: z
    .string()
    .min(1)
    .meta({ label: 'consents.slug', description: 'consents.slugInfo' }),
  defaultValue: z.boolean().default(true).meta({
    label: 'consents.checkedByDefault',
    description: 'consents.defaultValueInfo',
  }),
});
