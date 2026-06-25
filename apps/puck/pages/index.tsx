import '@puckeditor/core/puck.css';

import { useTheme } from '@emotion/react';
import { Data, Puck } from '@puckeditor/core';
import {
  Md2K,
  Md4K,
  MdDesktopWindows,
  MdSmartphone,
  MdTablet,
} from 'react-icons/md';

import { config } from '../src/puck/config';
import { alignmentPlugin } from '../src/puck/plugins/alignment';
import { borderPlugin } from '../src/puck/plugins/border';
import { colorPlugin } from '../src/puck/plugins/color/color';
import { columnsPlugin } from '../src/puck/plugins/columns';
import { datasourcePlugin } from '../src/puck/plugins/datasource';
import {
  BlocksPlugin,
  FieldsPlugin,
  OutlinePlugin,
} from '../src/puck/plugins/defaultPlugins';
import { EmotionPlugin } from '../src/puck/plugins/emotion';
import { HeadingAnalyzerPlugin } from '../src/puck/plugins/heading-analyzer';
import { paddingPlugin } from '../src/puck/plugins/padding';
import { palettePlugin } from '../src/puck/plugins/palette';
import { RawDataPlugin } from '../src/puck/plugins/raw-data';
import { resolvedPlugin } from '../src/puck/plugins/resolved';
import { RevisionHistoryPlugin } from '../src/puck/plugins/revision-history/revision-history';
import { richtextPlugin } from '../src/puck/plugins/richtext';
import { seoPlugin } from '../src/puck/plugins/seo';
import { SEOPreviewPlugin } from '../src/puck/plugins/seo-preview/seo-preview';
import { StockImagePlugin } from '../src/puck/plugins/stock-image/stock-image';
import { themePlugin } from '../src/puck/plugins/theme';
import { UserConfig } from '../src/puck/types';

// Describe the initial data
const initialData: Partial<Data<UserConfig['components']>> = {};

export default function Index() {
  const theme = useTheme();

  return (
    <Puck
      config={config}
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
        ...Object.entries(theme.breakpoints.values).flatMap(([key, value]) =>
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
