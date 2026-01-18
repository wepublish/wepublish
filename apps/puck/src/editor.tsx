import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';

import { TypedTextInputsPlugin } from './plugins/typed-text-inputs';
import { WepublishRichtextPlugin } from './plugins/wepublish-richtext';
import { RevisionHistoryPlugin } from './plugins/revision-history/revision-history';
import { EmotionPlugin } from './plugins/emotion';
import { HeadingAnalyzerPlugin } from './plugins/heading-analyzer';
import { puckConfig, PuckData } from './editor.config';
import { puckToBlockContentInput } from './api-puck-map';

// Describe the initial data
const initialData = {};

// Save the data to your database
const save = (data: PuckData) => {
  console.log({
    blockContent: puckToBlockContentInput(data),
    puck: data,
  });
};

// Render Puck editor
export function Editor() {
  return (
    <Puck
      config={puckConfig}
      data={initialData}
      onPublish={save}
      plugins={[
        EmotionPlugin,
        TypedTextInputsPlugin,
        WepublishRichtextPlugin,
        RevisionHistoryPlugin,
        HeadingAnalyzerPlugin,
      ]}
      _experimentalFullScreenCanvas={true}
    />
  );
}
