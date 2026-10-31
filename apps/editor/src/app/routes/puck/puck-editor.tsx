import '@puckeditor/core/puck.css';
import './puck-dark.css';

import { useQuery } from '@apollo/client/react';
import { createTheme, Link as MuiLink } from '@mui/material';
import { Puck, Viewport } from '@puckeditor/core';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { getSettings, WebsiteSettingsDocument } from '@wepublish/editor/api';
import {
  actionBarPlugin,
  alignmentPlugin,
  apiPlugin,
  BlocksPlugin,
  blockVisibilityPlugin,
  borderPlugin,
  breakpointsPlugin,
  colorPlugin,
  columnsPlugin,
  createAIPlugin,
  datasourcePlugin,
  documentHeaderPlugin,
  FieldsPlugin,
  gapPlugin,
  imagePlugin,
  insertPlugin,
  listPlugin,
  OutlinePlugin,
  paddingPlugin,
  palettePlugin,
  PuckDocumentController,
  PuckDocumentControllerContext,
  PuckDocumentKindContext,
  PuckRevisionHistory,
  PuckRevisionHistoryContext,
  recordPlugin,
  resolvedPlugin,
  RevisionHistoryPlugin,
  richtextPlugin,
  SearchPlugin,
  sidebarLayoutPlugin,
  stylingPlugin,
  switchPlugin,
  tagPlugin,
  tagSelectPlugin,
  typographyPlugin,
  viewportSelectionPlugin,
  visibilityOutlinePlugin,
  visibilityPlugin,
  webComponentsPlugin,
  WebsiteThemeContext,
  websiteThemePlugin,
  WebsiteTranslationsPlugin,
} from '@wepublish/puck-content/editor';
import { PuckData, PuckDocumentKind } from '@wepublish/puck-content/website';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteProvider } from '@wepublish/website';
import {
  BuilderLinkProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { ContextType, forwardRef, ReactNode, useMemo, useState } from 'react';
import {
  Md2K,
  Md4K,
  MdDesktopWindows,
  MdSmartphone,
  MdTablet,
} from 'react-icons/md';

import { documentControllerPlugin } from './puck-document-controller';
import {
  PuckDocumentEditorEventsContext,
  PuckPublishDialogOf,
} from './puck-document-controller.context';
import {
  bottomBarPlugin,
  initialPuckUi,
  puckEditorConfig,
  toEditorData,
  ViewportDevice,
  viewportPresets,
  visibleViewportPresets,
} from './puck-editor.config';

const viewportIcons: Record<ViewportDevice, ReactNode> = {
  phone: <MdSmartphone />,
  tablet: <MdTablet />,
  desktop: <MdDesktopWindows />,
  ultraWide: <Md2K />,
  '4k': <Md4K />,
};

const anonymousSession: NonNullable<ContextType<typeof SessionTokenContext>> = [
  null,
  false,
  async () => undefined,
];

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

export type PuckDocumentEditorProps<K extends PuckDocumentKind> = {
  kind: K;
  data: PuckData<K>;
  controller: PuckDocumentController;
  publishDialogOf?: PuckPublishDialogOf;
  revisionHistory?: PuckRevisionHistory;
  initialPlugin?: string | null;
  onPluginChange?: (plugin: string | null) => void;
};

export function PuckDocumentEditor<K extends PuckDocumentKind>({
  kind,
  data,
  controller,
  publishDialogOf,
  revisionHistory,
  initialPlugin,
  onPluginChange,
}: PuckDocumentEditorProps<K>) {
  const { data: settings } = useQuery(WebsiteSettingsDocument);
  const [initialData] = useState(() => toEditorData(kind, data));

  const theme = useMemo(
    () => createTheme(minimalTheme, settings?.websiteSettings.theme ?? {}),
    [settings]
  );

  const config = useMemo(
    () => puckEditorConfig(kind, initialData),
    [kind, initialData]
  );

  const aiPlugin = useMemo(
    () =>
      createAIPlugin({
        host: `${getSettings().apiURL}/api/puck/chat`,
      }),
    []
  );

  const plugins = useMemo(
    () => [
      BlocksPlugin,
      FieldsPlugin,
      OutlinePlugin,
      RevisionHistoryPlugin,
      SearchPlugin,
      insertPlugin,
      websiteThemePlugin,
      webComponentsPlugin,
      WebsiteTranslationsPlugin,
      aiPlugin,
      bottomBarPlugin,
      actionBarPlugin,
      documentHeaderPlugin,
      documentControllerPlugin,
      viewportSelectionPlugin,
      sidebarLayoutPlugin,
      datasourcePlugin,
      apiPlugin,
      paddingPlugin,
      gapPlugin,
      stylingPlugin,
      borderPlugin,
      breakpointsPlugin,
      alignmentPlugin,
      palettePlugin,
      columnsPlugin,
      listPlugin,
      tagPlugin,
      tagSelectPlugin,
      recordPlugin,
      richtextPlugin,
      colorPlugin,
      typographyPlugin,
      resolvedPlugin,
      switchPlugin,
      imagePlugin,
      visibilityPlugin,
      blockVisibilityPlugin,
      visibilityOutlinePlugin,
    ],
    [aiPlugin]
  );

  const events = useMemo(
    () => ({ publishDialogOf, onPluginChange }),
    [publishDialogOf, onPluginChange]
  );

  const [windowWidth] = useState(() => window.innerWidth);

  const ui = useMemo(
    () => initialPuckUi(initialPlugin, windowWidth),
    [initialPlugin, windowWidth]
  );

  const viewports = useMemo<Viewport[]>(
    () =>
      visibleViewportPresets(
        viewportPresets(theme.breakpoints.values),
        windowWidth
      ).map(({ device, ...preset }) => ({
        ...preset,
        icon: viewportIcons[device],
      })),
    [theme, windowWidth]
  );

  return (
    <WebsiteThemeContext.Provider value={theme}>
      <WebsiteProvider>
        <WebsiteBuilderProvider elements={{ Link }}>
          <SessionTokenContext.Provider value={anonymousSession}>
            <PuckDocumentKindContext.Provider value={kind}>
              <PuckDocumentControllerContext.Provider value={controller}>
                <PuckDocumentEditorEventsContext.Provider value={events}>
                  <PuckRevisionHistoryContext.Provider
                    value={revisionHistory ?? null}
                  >
                    <Puck
                      dnd={{ behavior: 'static', enableDragHandle: true }}
                      iframe={{ syncHostStyles: false }}
                      config={config}
                      data={initialData}
                      plugins={plugins}
                      ui={ui}
                      viewports={viewports}
                    />
                  </PuckRevisionHistoryContext.Provider>
                </PuckDocumentEditorEventsContext.Provider>
              </PuckDocumentControllerContext.Provider>
            </PuckDocumentKindContext.Provider>
          </SessionTokenContext.Provider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </WebsiteThemeContext.Provider>
  );
}
