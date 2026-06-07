import { ComponentConfig } from '@puckeditor/core';
import { IFrameBlock } from '@wepublish/block-content/website';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const IFrameConfig: ComponentConfig<{
  props: BuilderIFrameBlockProps;
  fields: UserFields;
}> = {
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
