import { Meta } from '@storybook/react';
import { IFrameBlock } from './iframe-block';
import { mockIFrameBlock } from '@wepublish/storybook/mocks';

export default {
  component: IFrameBlock,
  title: 'Blocks/IFrame',
} as Meta;

export const Default = {
  args: mockIFrameBlock(),
};
