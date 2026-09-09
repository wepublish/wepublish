import '@puckeditor/core/puck.css';

import { createTheme, Link as MuiLink, ThemeProvider } from '@mui/material';
import { Data, Puck, Viewport } from '@puckeditor/core';
import { withDynamicConfig } from '@puckeditor/plugin-ai';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { getSettings, useWebsiteSettingsQuery } from '@wepublish/editor/api';
import {
  alignmentPlugin,
  BlocksPlugin,
  borderPlugin,
  breakpointsPlugin,
  colorPlugin,
  columnsPlugin,
  createAIPlugin,
  datasourcePlugin,
  EmotionPlugin,
  FieldsPlugin,
  HeadingAnalyzerPlugin,
  imagePlugin,
  listPlugin,
  OutlinePlugin,
  paddingPlugin,
  palettePlugin,
  RawDataPlugin,
  resolvedPlugin,
  RevisionHistoryPlugin,
  richtextPlugin,
  SEOPreviewPlugin,
  StockImagePlugin,
  switchPlugin,
  themePlugin,
  typographyPlugin,
  viewportSelectionPlugin,
  visibilityPlugin,
  webComponentsPlugin,
} from '@wepublish/puck-content/editor';
import { config, UserConfig } from '@wepublish/puck-content/website';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteProvider } from '@wepublish/website';
import {
  BuilderLinkProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import websiteTranslations from '@wepublish/website/translations/de.json';
import { format } from 'date-fns';
import i18n from 'i18next';
import { ContextType, forwardRef, useMemo } from 'react';
import {
  Md2K,
  Md4K,
  MdDesktopWindows,
  MdSmartphone,
  MdTablet,
} from 'react-icons/md';

const initialData: Partial<Data<UserConfig['components']>> = {};

// The preview renders the website as an anonymous reader
const anonymousSession: NonNullable<ContextType<typeof SessionTokenContext>> = [
  null,
  false,
  async () => undefined,
];

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

// The preview renders website components, whose links must not use the
// editor's router
const Link = forwardRef<HTMLAnchorElement, BuilderLinkProps>(function Link(
  { prefetch, locale, ...props },
  ref
) {
  return (
    <MuiLink
      ref={ref}
      {...props}
    />
  );
});

let websiteTranslationsAdded = false;

/**
 * The website components translate with the website's German bundle, which
 * the editor's i18n instance does not know about. The preview always shows the
 * German copy, whatever language the editor UI runs in, so the bundle is added
 * to every editor language without overriding editor translations.
 */
const useWebsiteTranslations = () => {
  if (!websiteTranslationsAdded && i18n.isInitialized) {
    for (const language of ['de', 'en', 'fr']) {
      i18n.addResourceBundle(
        language,
        'translation',
        websiteTranslations,
        true,
        false
      );
    }

    websiteTranslationsAdded = true;
  }
};

export function PuckEditor() {
  useWebsiteTranslations();
  const { data } = useWebsiteSettingsQuery();

  const theme = useMemo(
    () => createTheme(minimalTheme, data?.websiteSettings.theme ?? {}),
    [data]
  );

  const aiPlugin = useMemo(
    () =>
      createAIPlugin({
        host: `${getSettings().apiURL}/api/puck/chat`,
      }),
    []
  );

  const dynamicConfig = useMemo(
    () => withDynamicConfig(config, initialData as Data),
    []
  );

  const viewports = useMemo<Viewport[]>(
    () => [
      {
        width: 360,
        height: (360 / 9) * 19.5,
        label: 'Small',
        icon: <MdSmartphone />,
      },
      ...Object.entries(theme.breakpoints.values).flatMap<Viewport>(
        ([key, value]) =>
          value ?
            {
              width: value,
              height: {
                sm: (value / 9) * 19.5,
                md: (value / 9) * 19.5,
                lg: (value / 16) * 9,
                xl: (value / 16) * 9,
              }[key],
              label: key,
              icon: {
                sm: <MdSmartphone />,
                md: <MdTablet />,
                lg: <MdDesktopWindows />,
                xl: <MdDesktopWindows />,
              }[key],
            }
          : []
      ),
      {
        width: 2560,
        height: 'auto',
        label: 'Ultra Wide',
        icon: <Md2K />,
      },
      {
        width: 3840,
        height: 'auto',
        label: '4k',
        icon: <Md4K />,
      },
    ],
    [theme]
  );

  return (
    <ThemeProvider theme={theme}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          elements={{ Link }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle: 'We.Publish' }}
        >
          <SessionTokenContext.Provider value={anonymousSession}>
            <Puck
              dnd={{ behavior: 'static' }}
              config={dynamicConfig}
              data={initialData}
              plugins={[
                BlocksPlugin,
                FieldsPlugin,
                OutlinePlugin,
                StockImagePlugin,
                RevisionHistoryPlugin,
                SEOPreviewPlugin,
                HeadingAnalyzerPlugin,
                RawDataPlugin,
                EmotionPlugin,
                webComponentsPlugin,
                aiPlugin,
                //
                themePlugin,
                viewportSelectionPlugin,
                //
                datasourcePlugin,
                paddingPlugin,
                borderPlugin,
                breakpointsPlugin,
                alignmentPlugin,
                palettePlugin,
                columnsPlugin,
                listPlugin,
                richtextPlugin,
                colorPlugin,
                typographyPlugin,
                resolvedPlugin,
                switchPlugin,
                imagePlugin,
                visibilityPlugin,
              ]}
              onPublish={data => {
                console.warn(data);
              }}
              viewports={viewports}
            />
          </SessionTokenContext.Provider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </ThemeProvider>
  );
}
