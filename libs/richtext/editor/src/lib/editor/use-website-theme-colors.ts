import { useWebsiteSettingsQuery } from '@wepublish/editor/api';
import { useMemo } from 'react';

export function useWebsiteThemeColors() {
  const { data } = useWebsiteSettingsQuery({
    fetchPolicy: 'cache-and-network',
  });

  return useMemo(() => {
    const { palette } = data?.websiteSettings.theme ?? {};

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
