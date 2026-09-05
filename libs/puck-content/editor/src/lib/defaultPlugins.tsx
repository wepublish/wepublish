import { blocksPlugin, fieldsPlugin, outlinePlugin } from '@puckeditor/core';

export const BlocksPlugin = blocksPlugin();
export const FieldsPlugin = fieldsPlugin({
  desktopSideBar: 'right',
});
export const OutlinePlugin = outlinePlugin();
