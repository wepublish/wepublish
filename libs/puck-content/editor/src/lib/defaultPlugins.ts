import {
  blocksPlugin,
  fieldsPlugin,
  outlinePlugin,
  Plugin,
} from '@puckeditor/core';
import { createElement } from 'react';

import { PuckPluginPanel } from './plugin-panel/plugin-panel-header.component';

const outline = outlinePlugin();

export const BlocksPlugin = blocksPlugin();
export const FieldsPlugin = fieldsPlugin({
  desktopSideBar: 'right',
});
export const OutlinePlugin: Plugin = {
  ...outline,
  render: () => createElement(PuckPluginPanel, null, outline.render?.()),
};
