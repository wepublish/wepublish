import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';
import { TypographyVariant } from '@wepublish/puck-content/website';

import { toAiSchema } from '../ai-schema';

export {
  customTypographyVariant,
  getThemeTypographyVariants,
  resolveFontFamily,
  resolveTypography,
} from '@wepublish/puck-content/website';
export type {
  TypographyValue,
  TypographyVariant,
} from '@wepublish/puck-content/website';

export type TypographyField = BaseField & {
  type: 'typography';
  /** Restrict the selectable theme variants, defaults to all of them */
  variants?: TypographyVariant[];
};

export const typographySchema = z
  .object({
    variant: z.string(),
    fontSize: z.string(),
    lineHeight: z.string(),
    fontFamily: z.string(),
    fontWeight: z.number().min(100).max(900),
  })
  .partial();

export const typographyFieldAi: FieldAiParams = {
  instructions:
    'Typography of the text. Prefer a theme variant (e.g. h1-h6, subtitle1, subtitle2, body1, body2, caption, overline) so the text matches the rest of the website. Only use the variant "custom" together with fontSize (CSS length such as 1.25rem), lineHeight (unitless number such as 1.4), fontFamily (name of a font configured for the website) and fontWeight (100-900) when a theme variant does not fit. Leave unset to keep the component default.',
  schema: toAiSchema(typographySchema),
};

export const fontWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
