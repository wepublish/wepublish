import { ComponentConfig } from '@puckeditor/core';
import { ListicleBlock } from '@wepublish/block-content/website';
import { mockRichText } from '@wepublish/storybook/mocks';
import { BuilderListicleBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const ListicleConfig: ComponentConfig<{
  props: BuilderListicleBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'An ordered list of titled entries, each with its own title and rich text body. Use it for listicles, step-by-step breakdowns, rankings or any "top N" style content. Add one item per entry; every item needs a title and can hold formatted rich text.',
  },
  fields: {
    items: {
      type: 'array',
      min: 1,
      getItemSummary: item => item.title || 'Title',
      arrayFields: {
        title: {
          type: 'text',
          contentEditable: true,
        },
        richText: {
          type: 'richtext',
        },
      },
      defaultItemProps: {
        title: 'Title',
        richText: mockRichText(),
      },
    },
  },
  defaultProps: {
    items: [
      {
        title: 'Title',
        richText: mockRichText(),
      },
    ],
  },

  render: ListicleBlock,
};
