import { CssBaseline, ThemeOptions, ThemeProvider } from '@mui/material';
import {
  WebsiteBuilderProps,
  WebsiteBuilderProvider,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { Fragment, PropsWithChildren, useMemo } from 'react';
import { PartialDeep } from 'type-fest';
import { WebsiteProvider } from './website.provider';

export type TenantProvidersProps = PropsWithChildren<{
  config: WebsiteTenantConfig;
  settingsTheme?: ThemeOptions;
  extra?: PartialDeep<WebsiteBuilderProps>;
}>;

export const TenantProviders = ({
  config,
  settingsTheme,
  extra,
  children,
}: TenantProvidersProps) => {
  const { createTheme, builder, Wrapper = Fragment, GlobalStyles } = config;
  const theme = useMemo(
    () => createTheme(settingsTheme),
    [createTheme, settingsTheme]
  );

  return (
    <ThemeProvider theme={theme}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          {...builder}
          {...extra}
        >
          <Wrapper>
            <CssBaseline />
            {GlobalStyles && <GlobalStyles />}
            {children}
          </Wrapper>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </ThemeProvider>
  );
};
