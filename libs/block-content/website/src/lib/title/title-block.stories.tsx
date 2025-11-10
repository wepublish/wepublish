import { Meta } from '@storybook/react';
import { TitleBlock } from './title-block';
import { mockTitleBlock } from '@wepublish/storybook/mocks';

export default {
  component: TitleBlock,
  title: 'Blocks/Title',
} as Meta;

export const Default = {
  args: mockTitleBlock(),
};

export const WithoutLead = {
  args: mockTitleBlock({ lead: '' }),
};

export const WithoutPreTitle = {
  args: mockTitleBlock({ preTitle: '' }),
};
