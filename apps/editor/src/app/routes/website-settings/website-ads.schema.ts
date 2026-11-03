import { crossField } from '@wepublish/form/editor';
import { z } from 'zod/v4';

const sparkLoopKey = z
  .string()
  .regex(/^pub_[a-f0-9]{12}$/)
  .or(z.literal(''))
  .nullish();

export const websiteAdsSchema = z.object({
  sparkLoop: crossField(
    z.object({
      enabled: z
        .boolean()
        .meta({ label: 'websiteSettings.ads.sparkLoop.enable' }),
      key: z.string().nullish().meta({
        label: 'websiteSettings.ads.sparkLoop.id',
        placeholder: 'websiteSettings.ads.sparkLoop.idPlaceholder',
      }),
    }),
    ['enabled', 'key'],
    ({ enabled, key }) => !enabled || sparkLoopKey.safeParse(key).success,
    { path: ['key'], error: 'websiteSettings.ads.sparkLoop.idInvalid' }
  ),
});
