import '@puckeditor/core/puck.css';
import './puck-dark.css';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { createTheme, Link as MuiLink } from '@mui/material';
import { Data, Puck, Viewport } from '@puckeditor/core';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { getSettings, WebsiteSettingsDocument } from '@wepublish/editor/api';
import {
  actionBarPlugin,
  alignmentPlugin,
  apiPlugin,
  blockLibraryPlugin,
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
  gridPlacementPlugin,
  groupPlugin,
  imageFitPlugin,
  imagePlugin,
  listPlugin,
  OutlinePlugin,
  paddingPlugin,
  palettePlugin,
  puckBlockDataPlugin,
  PuckData,
  PuckDocumentController,
  PuckDocumentControllerContext,
  PuckDocumentKindContext,
  PuckRevisionHistory,
  PuckRevisionHistoryContext,
  recordPlugin,
  resolvedPlugin,
  RevisionHistoryPlugin,
  revisionPreviewHeaderPlugin,
  PuckBlockTemplateDocumentContext,
  savedBlocksPlugin,
  withTranslatedLabels,
  richtextPlugin,
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
import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteProvider } from '@wepublish/website';
import {
  BuilderLinkProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import {
  ContextType,
  forwardRef,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
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
  blockTemplateEditorConfig,
  bottomBarPlugin,
  dynamicComponentsKey,
  initialPuckUi,
  puckEditorConfig,
  toEditorData,
  ViewportDevice,
  viewportPresets,
  visibleViewportPresets,
  withTemplateFields,
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
  templateNameLabel?: string;
  blockTemplate?: boolean;
};

export function PuckDocumentEditor<K extends PuckDocumentKind>({
  kind,
  data,
  controller,
  publishDialogOf,
  revisionHistory,
  initialPlugin,
  onPluginChange,
  templateNameLabel,
  blockTemplate,
}: PuckDocumentEditorProps<K>) {
  const { t } = useTranslation();
  const { data: settings } = useQuery(WebsiteSettingsDocument);
  const [initialData] = useState(() => toEditorData(kind, data));

  const theme = useMemo(
    () => createTheme(minimalTheme, settings?.websiteSettings.theme ?? {}),
    [settings]
  );

  const [configData, setConfigData] = useState(initialData);

  const config = useMemo(() => {
    const rootLabel = t(
      blockTemplate ?
        'puck.documentKind.blockTemplate'
      : `puck.documentKind.${kind}`
    );
    const documentConfig =
      blockTemplate ?
        blockTemplateEditorConfig(configData, templateNameLabel ?? '')
      : templateNameLabel === undefined ? puckEditorConfig(kind, configData)
      : withTemplateFields(
          puckEditorConfig(kind, configData),
          templateNameLabel
        );
    const labelled = withTranslatedLabels(documentConfig, t);

    return { ...labelled, root: { ...labelled.root, label: rootLabel } };
  }, [kind, configData, templateNameLabel, blockTemplate, t]);

  const refreshConfig = useCallback(
    (data: Data) => {
      if (dynamicComponentsKey(data) !== dynamicComponentsKey(configData)) {
        setConfigData(data);
      }
    },
    [configData]
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
      blockLibraryPlugin,
      websiteThemePlugin,
      webComponentsPlugin,
      WebsiteTranslationsPlugin,
      aiPlugin,
      bottomBarPlugin,
      actionBarPlugin,
      groupPlugin,
      documentHeaderPlugin,
      revisionPreviewHeaderPlugin,
      documentControllerPlugin,
      savedBlocksPlugin,
      puckBlockDataPlugin,
      viewportSelectionPlugin,
      sidebarLayoutPlugin,
      datasourcePlugin,
      apiPlugin,
      paddingPlugin,
      gapPlugin,
      gridPlacementPlugin,
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
      imageFitPlugin,
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
              <PuckBlockTemplateDocumentContext.Provider
                value={!!blockTemplate}
              >
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
                        onChange={refreshConfig}
                        plugins={plugins}
                        ui={ui}
                        viewports={viewports}
                      />
                    </PuckRevisionHistoryContext.Provider>
                  </PuckDocumentEditorEventsContext.Provider>
                </PuckDocumentControllerContext.Provider>
              </PuckBlockTemplateDocumentContext.Provider>
            </PuckDocumentKindContext.Provider>
          </SessionTokenContext.Provider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </WebsiteThemeContext.Provider>
  );
}
