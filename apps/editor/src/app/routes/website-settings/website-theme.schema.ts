import { withKind } from '@wepublish/form/core';
import { z } from 'zod/v4';

import {
  type Theme,
  paletteSchema,
  themeFontSchema,
  typographySchema,
} from './theme/theme.schema';

const editedWhole = <S extends z.ZodType>(schema: S): S =>
  withKind(schema, 'themeEditor') as unknown as S;

export const websiteThemeSchema = z.object({
  palette: editedWhole(paletteSchema),
  typography: editedWhole(typographySchema),
  importedFonts: z.array(themeFontSchema),
});

export type WebsiteThemeValues = z.output<typeof websiteThemeSchema>;

export const toThemeVariables = ({
  palette,
  typography,
}: WebsiteThemeValues): Theme => ({ palette, typography });
