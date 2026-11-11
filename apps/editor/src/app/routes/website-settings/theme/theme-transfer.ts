import { createTheme } from '@mui/material';
import {
  FontStyle,
  FontWeight,
  WebsiteRemoteFontInput,
} from '@wepublish/editor/api';
import { minimalTheme } from '@wepublish/ui';
import { z } from 'zod';

import { normalizeTheme, themeSchema } from './schema';

export const THEME_EXPORT_VERSION = 1;

type Theme = z.infer<typeof themeSchema>;

export type ThemeExport = {
  version: typeof THEME_EXPORT_VERSION;
  theme: Theme;
  fonts: WebsiteRemoteFontInput[];
};

const fontSchema = z.object({
  name: z.string().min(1),
  weight: z.array(z.nativeEnum(FontWeight)),
  style: z.array(z.nativeEnum(FontStyle)),
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * The font name a `fontFamily` value refers to, the way `AvailableFontsPicker`
 * writes it: `"Roboto", Helvetica, Arial, sans-serif` → `Roboto`.
 */
const fontNameOf = (fontFamily: unknown) =>
  typeof fontFamily === 'string' ?
    fontFamily.split(',')[0].replace(/"/g, '').trim()
  : undefined;

const usedFontNames = (typography: Theme['typography']) =>
  new Set(
    Object.values(typography)
      .map(variant => fontNameOf(variant?.fontFamily))
      .filter(Boolean)
  );

/**
 * What the theme page exports: exactly what Save stores (palette and
 * typography), plus the website fonts the typography refers to, so the file
 * can be imported into another media without missing fonts.
 */
export const createThemeExport = (
  theme: Theme,
  fonts: readonly WebsiteRemoteFontInput[]
): ThemeExport => {
  const used = usedFontNames(theme.typography);

  return {
    version: THEME_EXPORT_VERSION,
    theme: { palette: theme.palette, typography: theme.typography },
    fonts: fonts.filter(font => used.has(font.name)),
  };
};

/**
 * Reads an exported theme. Also accepts the earlier export format, which was
 * the whole MUI theme object (palette and typography at the top level, no
 * fonts). Throws when the file is not a valid theme.
 */
export const parseThemeImport = (
  json: unknown
): { theme: Theme; fonts: WebsiteRemoteFontInput[] } => {
  if (!isObject(json)) {
    throw new Error('Not a theme export');
  }

  const isCurrentFormat = isObject(json['theme']);
  const source = isCurrentFormat ? (json['theme'] as object) : json;
  const { palette, typography } = source as Record<string, unknown>;

  if (!isObject(palette) && !isObject(typography)) {
    throw new Error('Not a theme export');
  }

  const theme = themeSchema.parse(
    normalizeTheme(
      createTheme(minimalTheme, {
        palette: palette ?? {},
        typography: typography ?? {},
      })
    )
  );
  const fonts =
    isCurrentFormat ? z.array(fontSchema).parse(json['fonts'] ?? []) : [];

  return { theme, fonts };
};

const union = <T>(a: readonly T[], b: readonly T[]) => [
  ...a,
  ...b.filter(item => !a.includes(item)),
];

/**
 * The website fonts after adding imported ones: missing fonts are appended,
 * missing weights and styles of existing fonts are added. Returns `undefined`
 * when nothing changes, so Save does not touch the fonts setting.
 */
export const mergeFonts = (
  existing: readonly WebsiteRemoteFontInput[],
  imported: readonly WebsiteRemoteFontInput[]
): WebsiteRemoteFontInput[] | undefined => {
  let changed = false;
  const merged = existing.map(font => ({ ...font }));

  for (const font of imported) {
    const match = merged.find(({ name }) => name === font.name);

    if (!match) {
      merged.push(font);
      changed = true;
      continue;
    }

    const weight = union(match.weight, font.weight);
    const style = union(match.style, font.style);

    if (
      weight.length !== match.weight.length ||
      style.length !== match.style.length
    ) {
      match.weight = weight;
      match.style = style;
      changed = true;
    }
  }

  return changed ? merged : undefined;
};
