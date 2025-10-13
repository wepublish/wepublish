import { Meta } from '@storybook/react';
import { LinkPageBreakBlock } from '@wepublish/website/api';
import { ContextBox } from './context-box';

export default {
  component: ContextBox,
  title: 'Blocks/Break/Block Styles/Context Box',
} as Meta;

const breakBlock = {
  __typename: 'LinkPageBreakBlock',
  text: 'Break block test',
  linkText: 'Link Text',
  linkURL: 'https://example.com',
  styleOption: 'default',
  richText: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: '',
        },
      ],
    },
    {
      type: 'heading-three',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
        },
      ],
    },
    {
      type: 'heading-three',
      children: [
        {
          text: '',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          bold: true,
          text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          italic: true,
        },
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
          italic: true,
        },
        {
          text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
          italic: true,
          underline: true,
        },
      ],
    },
  ],
  linkTarget: null,
  hideButton: false,
  templateOption: 'none',
  layoutOption: 'image-left',
  image: null,
  blockStyle: 'Context Box',
} as LinkPageBreakBlock;

export const Default = {
  args: {
    ...breakBlock,
  },
};
