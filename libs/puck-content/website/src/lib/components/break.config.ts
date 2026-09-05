import { ComponentConfig } from '@puckeditor/core';
import { BreakBlock } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

import { richtextFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../types';

export const BreakConfig: ComponentConfig<{
  props: BuilderBreakBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A visually distinct call-to-action break that interrupts the article flow, typically to promote something. It shows a headline (text), a rich text body and, unless hidden, a button. Set hideButton to false and provide linkText (button label) and linkURL (button target) to show the button, or set hideButton to true to omit it.',
  },
  fields: {
    text: {
      type: 'text',
    },
    richText: {
      type: 'richtext',
      contentEditable: true,
      ai: richtextFieldAi,
    },
    hideButton: {
      type: 'radio',
      options: [
        { label: 'Hide', value: true },
        { label: 'Show', value: false },
      ],
    },
    linkText: {
      type: 'text',
      label: 'Button text',
    },
    linkURL: {
      type: 'text',
      label: 'Button URL',
    },
  },
  resolveFields: (data, params) => {
    if (data.props.hideButton) {
      const { linkText, linkURL, ...rest } = params.fields;

      return rest;
    }

    return params.fields;
  },
  defaultProps: {
    hideButton: false,
    richText: [],
  },

  render: BreakBlock,
};
