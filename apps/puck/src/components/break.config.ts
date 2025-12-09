import { ComponentConfig } from '@measured/puck';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { BreakBlock } from '@wepublish/block-content/website';
import { urlField } from '../fields/url';
import { richTextField } from '../fields/richtext';
import { mockRichText } from '@wepublish/storybook/mocks';

export const BreakConfig: ComponentConfig<BuilderBreakBlockProps> = {
  fields: {
    text: {
      type: 'text',
    },
    richText: richTextField,
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
      ...urlField,
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
    richText: mockRichText(),
  },
  inline: true,
  render: BreakBlock,
};
