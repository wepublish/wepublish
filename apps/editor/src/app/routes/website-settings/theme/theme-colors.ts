import { useQuery } from '@apollo/client/react';
import { WebsiteSettingsDocument } from '@wepublish/editor/api';
import { useMemo } from 'react';

type ColorValue = string | null | undefined;
type PaletteSection = Record<string, ColorValue>;
export type ThemePalette = Record<string, ColorValue | PaletteSection>;

const PALETTE_PATHS = [
  'primary.main',
  'secondary.main',
  'accent.main',
  'primary.light',
  'primary.dark',
  'secondary.light',
  'secondary.dark',
  'accent.light',
  'accent.dark',
  'info.main',
  'success.main',
  'warning.main',
  'error.main',
  'background.default',
  'background.paper',
  'text.primary',
  'divider',
];

const at = (palette: ThemePalette, path: string): ColorValue => {
  const [group, key] = path.split('.');
  const value = palette[group];

  if (!key) {
    return typeof value === 'string' ? value : undefined;
  }

  return typeof value === 'object' && value ? value[key] : undefined;
};

export const websiteThemeColors = (palette: ThemePalette): string[] => [
  ...new Set(
    PALETTE_PATHS.map(path => at(palette, path)).filter(
      (color): color is string => typeof color === 'string' && color.length > 0
    )
  ),
];

export const useWebsiteThemeColors = (): string[] | undefined => {
  const { data } = useQuery(WebsiteSettingsDocument);

  return useMemo(() => {
    const theme = data?.websiteSettings.theme as
      { palette?: ThemePalette } | undefined;
    const colors = websiteThemeColors(theme?.palette ?? {});

    return colors.length ? colors : undefined;
  }, [data]);
};
