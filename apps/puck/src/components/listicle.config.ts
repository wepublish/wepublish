import { ComponentConfig } from '@puckeditor/core';
import { BuilderListicleBlockProps } from '@wepublish/website/builder';
import { ListicleBlock } from '@wepublish/block-content/website';
import { richTextField } from '../fields/richtext';

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
        richText: richTextField,
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
  inline: true,
  render: ListicleBlock,
};
