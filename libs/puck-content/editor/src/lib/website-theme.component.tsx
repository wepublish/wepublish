import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import keenSliderStyles from 'keen-slider/keen-slider.min.css?inline';
import {
  createElement,
  Fragment,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { WebsiteThemeContext } from './website-theme';

export const WebsiteThemePreview = ({
  children,
  document: frameDocument,
}: PropsWithChildren<{ document?: Document }>) => {
  const theme = useContext(WebsiteThemeContext);
  const cache = useMemo(
    () =>
      frameDocument &&
      createCache({ key: 'website', container: frameDocument.head }),
    [frameDocument]
  );

  if (!cache) {
    return createElement(Fragment, null, children);
  }

  return (
    <CacheProvider value={cache}>
      {theme ?
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <GlobalStyles styles={keenSliderStyles} />
          {children}
        </ThemeProvider>
      : children}
    </CacheProvider>
  );
};
