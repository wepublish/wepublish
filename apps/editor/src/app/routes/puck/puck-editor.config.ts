import { Data, UiState } from '@puckeditor/core';
import { withDynamicConfig } from '@puckeditor/plugin-ai';
import {
  BOTH_SIDEBARS_MIN_WIDTH,
  createBottomBarPlugin,
  getPuckConfig,
  HeadingAnalyzerPlugin,
  isCompactSidebarWidth,
  LoadedPuckDocument,
  PUCK_MOBILE_LAYOUT_WIDTH,
  PuckConfig,
  PuckData,
  PuckRevisionContent,
  RawDataPlugin,
  SEOPreviewPlugin,
} from '@wepublish/puck-content/editor';
import { PuckDocumentKind } from '@wepublish/puck-content/website';

export const bottomBarPlugin = createBottomBarPlugin([
  SEOPreviewPlugin,
  HeadingAnalyzerPlugin,
  RawDataPlugin,
]);

const editorData: {
  [K in PuckDocumentKind]: (data: PuckData<K>) => Data;
} = {
  page: data => data,
  article: data => data,
};

export const toEditorData = <K extends PuckDocumentKind>(
  kind: K,
  data: PuckData<K>
): Data => editorData[kind](data);

export const puckEditorConfig = (
  kind: PuckDocumentKind,
  data: Data
): PuckConfig => withDynamicConfig(getPuckConfig(kind), data);

export const toRevisionContent = <K extends PuckDocumentKind>(
  kind: K,
  loaded: LoadedPuckDocument<K>,
  failure: string
): PuckRevisionContent => {
  if (!loaded.data) {
    throw new Error(failure);
  }

  const data = toEditorData(kind, loaded.data);

  return { data, config: puckEditorConfig(kind, data) };
};

export type ViewportDevice =
  'phone' | 'tablet' | 'desktop' | 'ultraWide' | '4k';

export type ViewportPreset = {
  width: number;
  height: number | 'auto';
  label: string;
  device: ViewportDevice;
};

const MIN_VIEWPORT_ZOOM = 1 / 3;

const breakpointDevices: Partial<Record<string, ViewportDevice>> = {
  sm: 'phone',
  md: 'tablet',
  lg: 'desktop',
  xl: 'desktop',
};

export const viewportPresets = (
  breakpoints: Partial<Record<string, number>>
): ViewportPreset[] => {
  const presets: ViewportPreset[] = [
    {
      width: 360,
      height: 'auto',
      label: 'Small',
      device: 'phone',
    },
    ...Object.entries(breakpoints).flatMap(([label, width]) => {
      if (!width) {
        return [];
      }

      const device = breakpointDevices[label] ?? 'desktop';

      return { width, height: 'auto' as const, label, device };
    }),
    { width: 2560, height: 'auto', label: 'Ultra wide', device: 'ultraWide' },
    { width: 3840, height: 'auto', label: '4k', device: '4k' },
  ];

  return presets.sort((a, b) => a.width - b.width);
};

export const visibleViewportPresets = (
  presets: ViewportPreset[],
  windowWidth: number
): ViewportPreset[] =>
  presets
    .filter(
      (preset, index) =>
        index === 0 || preset.width * MIN_VIEWPORT_ZOOM <= windowWidth
    )
    .map(preset =>
      windowWidth < PUCK_MOBILE_LAYOUT_WIDTH ?
        { ...preset, height: 'auto' }
      : preset
    );

export const initialPuckUi = (
  plugin: string | null | undefined,
  windowWidth: number
): Partial<UiState> | undefined => {
  if (plugin && isCompactSidebarWidth(windowWidth)) {
    return {
      plugin: { current: plugin },
      leftSideBarVisible: true,
      rightSideBarVisible: false,
    };
  }

  if (plugin) {
    return { plugin: { current: plugin } };
  }

  if (windowWidth < BOTH_SIDEBARS_MIN_WIDTH) {
    return { leftSideBarVisible: false };
  }

  return undefined;
};
