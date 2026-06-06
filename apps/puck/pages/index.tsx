import '@puckeditor/core/puck.css';

import { Data, Puck } from '@puckeditor/core';

import { config } from '../src/puck/config';
import { borderPlugin } from '../src/puck/plugins/border';
import { columnsPlugin } from '../src/puck/plugins/columns';
import { datasourcePlugin } from '../src/puck/plugins/datasource';
import { EmotionPlugin } from '../src/puck/plugins/emotion';
import { HeadingAnalyzerPlugin } from '../src/puck/plugins/heading-analyzer';
import { paddingPlugin } from '../src/puck/plugins/padding';
import { rawDataPlugin } from '../src/puck/plugins/raw-data';
import { RevisionHistoryPlugin } from '../src/puck/plugins/revision-history/revision-history';
import { seoPlugin } from '../src/puck/plugins/seo';

// Describe the initial data
const initialData: Partial<Data> = {};

// Save the data to your database
const save = (data: Data) => {
  // TODO: persist the page data
};

export default function Index() {
  return (
    <Puck
      config={config}
      data={initialData}
      plugins={[
        EmotionPlugin,
        RevisionHistoryPlugin,
        HeadingAnalyzerPlugin,
        datasourcePlugin,
        seoPlugin,
        paddingPlugin,
        borderPlugin,
        columnsPlugin,
        rawDataPlugin,
      ]}
      onPublish={save}
      _experimentalFullScreenCanvas={true}
    />
  );
}
