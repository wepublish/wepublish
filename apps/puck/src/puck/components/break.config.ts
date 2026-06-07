import { ComponentConfig } from '@puckeditor/core';
import { BreakBlock } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../types';

export const BreakConfig: ComponentConfig<{
  props: BuilderBreakBlockProps;
  fields: UserFields;
}> = {
  fields: {
    text: {
      type: 'text',
    },
    richText: {
      type: 'richtext',
      contentEditable: true,
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
