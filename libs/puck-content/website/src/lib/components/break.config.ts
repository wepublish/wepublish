import { faker } from '@faker-js/faker';
import { ComponentConfig } from '@puckeditor/core';
import { mockRichText } from '@wepublish/storybook/mocks';

import {
  imageFieldAi,
  richtextFieldAi,
  switchFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../types';
import { BreakConfigProps, BreakRender } from './break.component';

export const BreakConfig: ComponentConfig<{
  props: BreakConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A visually distinct call-to-action break that interrupts the article flow, typically to promote something. It shows a headline (text) or an image (imageId, never both: the image replaces the headline), a rich text body and, unless hidden, a button. Set hideButton to false and provide linkText (button label) and linkURL (button target) to show the button, or set hideButton to true to omit it. imageId references an already uploaded image — keep the existing value and never invent one.',
  },
  fields: {
    text: {
      type: 'text',
      label: 'Headline',
      contentEditable: true,
      ai: {
        instructions:
          'Short attention-grabbing headline. Not shown when an image is set.',
      },
    },
    imageId: {
      type: 'image',
      ai: imageFieldAi,
    },
    richText: {
      type: 'richtext',
      ai: richtextFieldAi,
    },
    hideButton: {
      type: 'switch',
      label: 'Hide button',
      ai: switchFieldAi(
        'Whether the call-to-action button is hidden. When false, linkText and linkURL are required.'
      ),
    },
    linkText: {
      type: 'text',
      contentEditable: true,
      label: 'Button text',
      ai: {
        instructions: 'Label of the call-to-action button, e.g. "Learn more".',
      },
    },
    linkURL: {
      type: 'text',
      label: 'Button URL',
      ai: {
        instructions: 'Absolute URL or site-relative path the button links to.',
      },
    },
    linkTarget: {
      type: 'select',
      label: 'Open link in',
      options: [
        { label: 'Same tab', value: '_self' },
        { label: 'New tab', value: '_blank' },
      ],
      ai: {
        instructions:
          'Where the button link opens: "_self" for the same tab, "_blank" for a new tab. Use "_blank" for external sites.',
      },
    },
  },
  resolveFields: (data, params) => {
    if (data.props.hideButton) {
      const { linkText, linkURL, linkTarget, ...rest } = params.fields;

      return rest;
    }

    return params.fields;
  },
  defaultProps: {
    text: faker.lorem.sentence(),
    hideButton: false,
    linkText: 'Learn more',
    linkURL: faker.internet.url(),
    linkTarget: '_blank',
    richText: mockRichText(),
  },

  render: BreakRender,
};
