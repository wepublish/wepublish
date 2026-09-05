import '@puckeditor/core/puck.css';

import { useTheme } from '@emotion/react';
import { Data, Puck, Viewport } from '@puckeditor/core';
import { withDynamicConfig } from '@puckeditor/plugin-ai';
import {
  AIPlugin,
  alignmentPlugin,
  BlocksPlugin,
  borderPlugin,
  colorPlugin,
  columnsPlugin,
  datasourcePlugin,
  EmotionPlugin,
  FieldsPlugin,
  HeadingAnalyzerPlugin,
  OutlinePlugin,
  paddingPlugin,
  palettePlugin,
  RawDataPlugin,
  resolvedPlugin,
  RevisionHistoryPlugin,
  richtextPlugin,
  seoPlugin,
  SEOPreviewPlugin,
  StockImagePlugin,
  themePlugin,
} from '@wepublish/puck-content/editor';
import { config, UserConfig } from '@wepublish/puck-content/website';
import {
  Md2K,
  Md4K,
  MdDesktopWindows,
  MdSmartphone,
  MdTablet,
} from 'react-icons/md';

const initialData: Partial<Data<UserConfig['components']>> = {};

export default function Index() {
  const theme = useTheme();
  const dynamicConfig = withDynamicConfig(config, initialData as Data);

  return (
    <Puck
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
        AIPlugin,
        //
        themePlugin,
        //
        datasourcePlugin,
        seoPlugin,
        paddingPlugin,
        borderPlugin,
        alignmentPlugin,
        palettePlugin,
        columnsPlugin,
        richtextPlugin,
        colorPlugin,
        resolvedPlugin,
      ]}
      onPublish={data => {
        console.warn(data);
      }}
      viewports={[
        {
          width: 360,
          height: 'auto',
          label: 'Small',
          icon: <MdSmartphone />,
        },
        ...Object.entries(theme.breakpoints.values).flatMap<Viewport>(
          ([key, value]) =>
            value ?
              {
                width: value,
                height: 'auto',
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
      ]}
    />
  );
}
