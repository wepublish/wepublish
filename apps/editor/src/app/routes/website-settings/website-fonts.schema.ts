import { FontStyle, FontWeight } from '@wepublish/editor/api';
import { z } from 'zod/v4';

const websiteFont = z.object({
  name: z.string().min(1).meta({
    label: 'websiteSettings.fonts.font',
    placeholder: 'websiteSettings.fonts.searchPlaceholder',
  }),
  weight: z.array(z.enum(FontWeight)),
  style: z.array(z.enum(FontStyle)),
});

export const websiteFontsSchema = z.object({
  fonts: z.array(websiteFont).meta({ label: 'websiteSettings.fonts.title' }),
});
