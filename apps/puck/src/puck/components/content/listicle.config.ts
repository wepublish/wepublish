import { ComponentConfig } from '@puckeditor/core';
import { ListicleBlock } from '@wepublish/block-content/website';
import { BuilderListicleBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const ListicleConfig: ComponentConfig<{
  props: BuilderListicleBlockProps;
  fields: UserFields;
}> = {
  fields: {
    items: {
      type: 'array',
      min: 1,
      getItemSummary: item => item.title || 'Title',
      arrayFields: {
        title: {
          type: 'text',
        },
        richText: {
          type: 'richtext',
        },
      },
      defaultItemProps: {
        title: 'Title',
        richText: [],
      },
    },
  },
  defaultProps: {
    items: [
      {
        richText: [],
        title: 'Title',
      },
    ],
  },

  render: ListicleBlock,
};
