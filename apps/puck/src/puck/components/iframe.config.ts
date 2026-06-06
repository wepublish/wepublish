import { ComponentConfig } from '@puckeditor/core';
import { IFrameBlock } from '@wepublish/block-content/website';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';

export const IFrameConfig: ComponentConfig<BuilderIFrameBlockProps> = {
  fields: {
    url: {
      type: 'text',
    },
    title: {
      type: 'text',
    },
  },
  defaultProps: {
    sandbox: 'sandbox',
  },

  render: IFrameBlock,
};
