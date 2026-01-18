import { ComponentConfig } from '@puckeditor/core';
import { BuilderListicleBlockProps } from '@wepublish/website/builder';
import { ListicleBlock } from '@wepublish/block-content/website';

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
        richText: null,
      },
    },
  },
  defaultProps: {
    items: [
      {
        richText: null,
        title: 'Title',
      },
    ],
  },
  inline: true,
  render: ListicleBlock,
};
