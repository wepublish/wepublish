import { Meta } from '@storybook/react';
import { mockImage } from '@wepublish/storybook/mocks';

import { WithWebsiteProviderDecorator } from '../with-website-builder-provider';
import { BreakBlock } from './tsri-break-block';

export default {
  component: BreakBlock,
  title: 'Tsri/Blocks/Break Block',
  decorators: [WithWebsiteProviderDecorator],
} as Meta;

export const Default = {
  args: {
    text: 'Tsüri Adventskalender',
    type: 'linkPageBreak',
    image: mockImage(),
    imageID: '5e653fb0-c76d-4496-99a6-5ddeb8112a8f',
    linkURL: 'https://tsri.ch/Tsüri-Adventskalender-2025',
    linkText: 'Jetzt gewinnen!',
    richText: [
      {
        type: 'paragraph',
        children: [
          {
            text: '24 Tage, 24 Preise – Mach mit bei unseren Advents-Verlosungen. ',
          },
        ],
      },
    ],
    blockStyle: null,
    hideButton: false,
  },
};
