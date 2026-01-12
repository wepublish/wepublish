import { Meta } from '@storybook/react';
import { mockImage } from '@wepublish/storybook/mocks';

import { WithWebsiteProviderDecorator } from '../../testing/with-website-builder-provider';
import { BreakBlock } from './tsri-attention-catcher';

export default {
  component: BreakBlock,
  title: 'Tsri/Blocks/Break Block',
  decorators: [WithWebsiteProviderDecorator],
} as Meta;

export const Default = {
  args: {
    text: 'Shop',
    type: 'linkPageBreak',
    image: mockImage(),
    imageID: '5e653fb0-c76d-4496-99a6-5ddeb8112a8f',
    linkURL: '/shop',
    linkText: 'Cras elementum ultrices',
    richText: [
      {
        type: 'heading-two',
        children: [
          {
            text: 'Neu! Pellentesque congue',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'Ut in risus volutpat libero phretra tempor. Cras vestibulum bibendum Tsuri augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; \n\nDesign von ',
          },
          {
            text: 'Armanda Asani',
            underline: true,
          },
          {
            text: '\nCHF 42.00\n\nJetzt im Shop erhältlich.',
          },
        ],
      },
    ],
    blockStyle: null,
    hideButton: false,
  },
};
