import { ComponentConfig } from '@puckeditor/core';
import {
  BreakConfigProps,
  BreakExtra,
  BreakRender,
} from '@wepublish/puck-content/website';
import { MdCampaign } from 'react-icons/md';

import { richtextFieldAi } from '../../richtext/richtext.field';
import { switchFieldAi } from '../../switch/switch.field';
import { placeholderRichText } from '../placeholder-richtext';
import { editorRender } from '../../blocks/editor-render';
import {
  withImageDataSource,
  WithDataSource,
} from '../../blocks/with-datasource';
import { UserFields } from '../../fields';
import { useOverlayPortalOnModifier } from '../../overlay-portal';

const useBreakEditorExtra = (): Partial<BreakExtra> => ({
  refs: { button: useOverlayPortalOnModifier() },
});

export const BreakConfig: ComponentConfig<{
  props: WithDataSource<BreakConfigProps>;
  fields: UserFields;
}> = withImageDataSource<BreakConfigProps>({
  icon: MdCampaign,
  category: 'text',
  order: 6,
  nameKey: 'puck.blocks.names.Break',
  ai: {
    instructions:
      'A visually distinct call-to-action break that interrupts the article flow, typically to promote something. It shows a headline (text), an optional image (the image datasource), a rich text body and, unless hidden, a button. With an image, the image takes the place of the headline and the headline moves above the rich text body. Set hideButton to false and provide linkText (button label) and linkURL (button target) to show the button, or set hideButton to true to omit it. The image is referenced by the single image datasource. Keep the existing value and never invent one.',
  },
  fields: {
    text: {
      type: 'text',
      label: 'Headline',
      contentEditable: true,
      ai: {
        instructions:
          'Short attention-grabbing headline. With an image it moves above the rich text body.',
      },
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
    text: 'Hello, world',
    hideButton: false,
    linkText: 'Learn more',
    linkURL: '/',
    linkTarget: '_self',
    richText: placeholderRichText(),
  },

  render: editorRender(BreakRender, { useExtra: useBreakEditorExtra }),
});
