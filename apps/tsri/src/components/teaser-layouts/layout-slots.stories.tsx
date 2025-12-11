import { Meta } from '@storybook/react';
import { mockTeaserSlotsBlock } from '@wepublish/storybook/mocks';

import { WithWebsiteProviderDecorator } from '../../with-website-builder-provider';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriBaseTeaserSlots } from './tsri-base-teaser-slots';

export default {
  component: TsriBaseTeaserSlots,
  title: 'Container/Tsri/TeaserSlots',
  decorators: [WithWebsiteProviderDecorator],
} as Meta;

const mockTeaserSlotsBlockData = mockTeaserSlotsBlock({
  blockStyle: '',
});

/*
(
  mockTeaserSlotsBlockData as typeof mockTeaserSlotsBlockData & {
    alignmentForTeaserBlock: (index: number) => FlexAlignment;
  }
).alignmentForTeaserBlock = alignmentForTeaserBlock;
*/

export const Default = {
  args: mockTeaserSlotsBlockData,
};

export const FullsizeImage = {
  args: { ...Default.args, blockStyle: TsriTeaserType.FullsizeImage },
};

export const NoImage = {
  args: { ...Default.args, blockStyle: TsriTeaserType.NoImage },
};

export const NoImageAltColor = {
  args: { ...Default.args, blockStyle: TsriTeaserType.NoImageAltColor },
};

export const TwoCol = {
  args: { ...Default.args, blockStyle: TsriTeaserType.TwoCol },
};

export const TwoColAltColor = {
  args: { ...Default.args, blockStyle: TsriTeaserType.TwoColAltColor },
};

export const ArchiveTopic = {
  args: { ...Default.args, blockStyle: 'ArchiveTopic' },
};

export const ArchiveTopicWithTwoCol = {
  args: { ...Default.args, blockStyle: 'ArchiveTopicWithTwoCol' },
};

export const ArchiveTopicAuthor = {
  args: { ...Default.args, blockStyle: 'ArchiveTopicAuthor' },
};

export const FrontTop = {
  args: { ...Default.args, blockStyle: 'FrontTop' },
};
