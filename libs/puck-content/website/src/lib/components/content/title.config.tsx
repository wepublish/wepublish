import { ComponentConfig } from '@puckeditor/core';
import { TitleBlock } from '@wepublish/block-content/website';
import { BuilderTitleBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const TitleConfig: ComponentConfig<{
  props: BuilderTitleBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'The main heading of an article or section. Renders a large title with an optional pre-title (an eyebrow/kicker shown above the title) and an optional lead paragraph (a short intro or teaser shown below the title). Use it to introduce content; there is usually only one Title at the top of a page.',
  },
  fields: {
    title: {
      type: 'text',
      contentEditable: true,
    },
    preTitle: {
      type: 'text',
      contentEditable: true,
    },
    lead: {
      type: 'textarea',
      contentEditable: true,
    },
  },
  defaultProps: {
    title: 'Hello, world',
    preTitle: 'Pretitle',
    lead: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  },

  render: TitleBlock,
};
