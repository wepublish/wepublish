import {
  BannerActionRole,
  type CreateBannerInput,
  type FullBannerFragment,
  type FullImageFragment,
  LoginStatus,
} from '@wepublish/editor/api';
import {
  formFields,
  type FormDefaultValues,
  type FormOutput,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const notNegative = { error: 'banner.form.mustNotBeNegative' };

export const bannerActionSchema = z.object({
  label: z.string().meta({ label: 'banner.form.action.label' }),
  url: z.string().meta({ label: 'banner.form.action.url' }),
  style: z.string().meta({
    label: 'banner.form.action.style',
    description: 'banner.form.action.styleInfo',
  }),
  role: z.enum(BannerActionRole).default(BannerActionRole.Other).meta({
    label: 'banner.form.action.role',
    description: 'banner.form.action.roleInfo',
    optionLabelPrefix: 'banner.actions.role.',
  }),
});

export const bannerSchema = z.object({
  active: z.boolean().meta({ label: 'banner.form.active' }),
  collapsible: z.boolean().default(true).meta({
    label: 'banner.form.collapsible',
    description: 'banner.form.collapsibleInfo',
  }),
  delay: z
    .number()
    .int()
    .min(0, notNegative)
    .default(0)
    .meta({ label: 'banner.form.delay', description: 'banner.form.delayInfo' }),
  hideForMinutes: z
    .number()
    .int()
    .min(0, notNegative)
    .default(24 * 60)
    .meta({ label: 'banner.form.hideForMinutes' }),
  showForLoginStatus: formFields
    .radio(z.enum(LoginStatus))
    .default(LoginStatus.All)
    .meta({
      label: 'banner.form.showForLoginStatus',
      description: 'banner.form.showForLoginStatusInfo',
      optionLabelPrefix: 'banner.form.loginStatus.',
    }),
  showOnArticles: z.boolean().meta({ label: 'banner.form.showOnArticles' }),
  showOnPages: formFields.pages().meta({
    label: 'banner.form.showOnPages',
    description: 'banner.form.showOnPagesInfo',
    placeholder: 'navigation.panels.selectPage',
  }),
  title: z.string().min(1).meta({ label: 'banner.form.title' }),
  text: formFields.textarea().min(1).meta({ label: 'banner.form.text' }),
  cta: z
    .string()
    .nullish()
    .meta({ label: 'banner.form.cta', description: 'banner.form.ctaInfo' }),
  image: formFields
    .image<FullImageFragment>()
    .nullish()
    .meta({ label: 'banner.form.image' }),
  html: formFields
    .textarea()
    .nullish()
    .meta({ label: 'banner.form.html', description: 'banner.form.htmlInfo' }),
  embedUrl: z.string().nullish().meta({
    label: 'banner.form.embedUrl',
    helperText: 'banner.form.embedUrlHelp',
  }),
  actions: z.array(bannerActionSchema).meta({ label: 'banner.form.actions' }),
});

export type BannerFormOutput = FormOutput<typeof bannerSchema>;

export const fromBanner = (
  banner: FullBannerFragment
): FormDefaultValues<typeof bannerSchema> => ({
  title: banner.title,
  text: banner.text,
  cta: banner.cta,
  html: banner.html,
  embedUrl: banner.embedUrl,
  active: banner.active,
  collapsible: banner.collapsible,
  delay: banner.delay,
  hideForMinutes: banner.hideForMinutes,
  showForLoginStatus: banner.showForLoginStatus ?? LoginStatus.All,
  showOnArticles: banner.showOnArticles,
  showOnPages: banner.showOnPages?.map(page => page.id) ?? [],
  image: banner.image,
  actions:
    banner.actions?.map(({ label, url, style, role }) => ({
      label,
      url,
      style,
      role,
    })) ?? [],
});

export const toBannerInput = ({
  image,
  showOnPages,
  ...banner
}: BannerFormOutput): CreateBannerInput => ({
  ...banner,
  imageId: image?.id,
  showOnPages: showOnPages.map(id => ({ id })),
});
