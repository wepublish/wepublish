import { ComponentConfig } from '@measured/puck';
import { IFrameBlock } from '@wepublish/block-content/website';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';
import { urlField } from '../fields/url';

export const IFrameConfig: ComponentConfig<BuilderIFrameBlockProps> = {
  fields: {
    url: urlField,
    title: {
      type: 'text',
    },
  },
  defaultProps: {
    sandbox: 'sandbox',
  },
  inline: true,
  render: IFrameBlock,
};
