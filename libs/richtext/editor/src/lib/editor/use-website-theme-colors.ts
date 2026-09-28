import { useQuery } from '@apollo/client/react';
import { WebsiteSettingsDocument } from '@wepublish/editor/api';
import { useMemo } from 'react';

type ThemeColor = {
  main?: string | null;
  light?: string | null;
  dark?: string | null;
  contrastText?: string | null;
};

/**
 * Structural type for the parts of the website theme (a JSONObject scalar,
 * typed as `unknown` by codegen) that this hook reads.
 */
type WebsiteTheme = {
  palette?: {
    primary: ThemeColor;
    secondary: ThemeColor;
    accent: ThemeColor;
    info: ThemeColor;
    success: ThemeColor;
    error: ThemeColor;
    warning: ThemeColor;
    text: { primary?: string | null };
    background: { default?: string | null; paper?: string | null };
  };
};

export function useWebsiteThemeColors() {
  const { data } = useWebsiteSettingsQuery({
    fetchPolicy: 'cache-and-network',
  });

  return useMemo(() => {
    const { palette } = (data?.websiteSettings.theme ?? {}) as WebsiteTheme;

    if (!palette) {
      return undefined;
    }

    const colors = [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.info,
      palette.success,
      palette.error,
      palette.warning,
    ].flatMap(({ main, light, dark, contrastText }) => [
      main,
      light,
      dark,
      contrastText,
    ]);

    colors.push(
      palette.text.primary,
      palette.background.default,
      palette.background.paper
    );

    return [...new Set(colors)].filter((color): color is string => !!color);
  }, [data]);
}
