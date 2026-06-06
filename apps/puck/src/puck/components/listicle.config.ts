import { ComponentConfig } from '@puckeditor/core';
import { ListicleBlock } from '@wepublish/block-content/website';
import { BuilderListicleBlockProps } from '@wepublish/website/builder';

export const ListicleConfig: ComponentConfig<BuilderListicleBlockProps> = {
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
