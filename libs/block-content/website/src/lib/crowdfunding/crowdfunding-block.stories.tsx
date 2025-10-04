import { Meta, StoryObj } from '@storybook/react';
import { CrowdfundingBlock } from './crowdfunding-block';
import { mockCrowdfundingBlock } from '@wepublish/storybook/mocks';

export default {
  component: CrowdfundingBlock,
  title: 'Blocks/Crowdfunding',
} as Meta;

export const Default: StoryObj = {
  args: mockCrowdfundingBlock(),
};

export const Empty: StoryObj = {
  args: {},
};
