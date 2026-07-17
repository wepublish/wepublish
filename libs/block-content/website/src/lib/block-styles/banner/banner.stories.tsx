import { Meta } from '@storybook/nextjs';
import { Banner } from './banner';
import { mockBreakBlock } from '@wepublish/storybook/mocks';

export default {
  component: Banner,
  title: 'Blocks/Break/Block Styles/Banner',
} as Meta;

export const Default = {
  args: mockBreakBlock(),
};
