import { crossField } from '@wepublish/form/editor';
import { z } from 'zod/v4';

const googleAnalyticsKey = z
  .string()
  .regex(/^(G|UA|YT|MO)-[A-Za-z0-9-]+$/)
  .or(z.literal(''))
  .nullish();

const googleTagManagerKey = z
  .string()
  .regex(/^GTM-[A-Za-z0-9]+$/)
  .or(z.literal(''))
  .nullish();

const plausibleKey = z
  .string()
  .regex(/^PA-[A-Za-z0-9_-]+$/i)
  .or(z.literal(''))
  .nullish();

type Provider = { enabled: boolean; key?: string | null };

const validWhenEnabled =
  (key: z.ZodType) =>
  ({ enabled, key: value }: Provider) =>
    !enabled || key.safeParse(value).success;

export const websiteAnalyticsSchema = z.object({
  googleAnalytics: crossField(
    z.object({
      enabled: z
        .boolean()
        .meta({ label: 'websiteSettings.analytics.google.gaEnable' }),
      key: z.string().nullish().meta({
        label: 'websiteSettings.analytics.google.gaId',
        placeholder: 'websiteSettings.analytics.google.gaPlaceholder',
      }),
    }),
    ['enabled', 'key'],
    validWhenEnabled(googleAnalyticsKey),
    { path: ['key'], error: 'websiteSettings.analytics.google.gaInvalid' }
  ),
  googleTagManager: crossField(
    z.object({
      enabled: z
        .boolean()
        .meta({ label: 'websiteSettings.analytics.google.gtmEnable' }),
      key: z.string().nullish().meta({
        label: 'websiteSettings.analytics.google.gtmId',
        placeholder: 'websiteSettings.analytics.google.gtmPlaceholder',
      }),
    }),
    ['enabled', 'key'],
    validWhenEnabled(googleTagManagerKey),
    { path: ['key'], error: 'websiteSettings.analytics.google.gtmInvalid' }
  ),
  plausible: crossField(
    z.object({
      enabled: z
        .boolean()
        .meta({ label: 'websiteSettings.analytics.plausible.enable' }),
      key: z.string().nullish().meta({
        label: 'websiteSettings.analytics.plausible.paId',
        placeholder: 'websiteSettings.analytics.plausible.paPlaceholder',
      }),
    }),
    ['enabled', 'key'],
    validWhenEnabled(plausibleKey),
    { path: ['key'], error: 'websiteSettings.analytics.plausible.paInvalid' }
  ),
  piwik: z.object({
    enabled: z
      .boolean()
      .meta({ label: 'websiteSettings.analytics.piwik.enable' }),
    key: z.string().nullish().meta({
      label: 'websiteSettings.analytics.piwik.proId',
      placeholder: 'websiteSettings.analytics.piwik.proPlaceholder',
    }),
  }),
});

export type WebsiteAnalyticsProvider = keyof z.output<
  typeof websiteAnalyticsSchema
>;
