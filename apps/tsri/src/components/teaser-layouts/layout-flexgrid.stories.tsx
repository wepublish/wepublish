import { Meta } from '@storybook/react';
import { mockTeaserGridFlexBlock } from '@wepublish/storybook/mocks';

import { WithWebsiteProviderDecorator } from '../../with-website-builder-provider';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriBaseTeaserGridFlex } from './tsri-base-teaser-flex-grid';

export default {
  component: TsriBaseTeaserGridFlex,
  title: 'Container/Tsri/TeaserFlexGrid',
  decorators: [WithWebsiteProviderDecorator],
} as Meta;

const mockFlexGridBlockData = mockTeaserGridFlexBlock({
  blockStyle: '',
});

/*
(
  mockFlexGridBlockData as typeof mockFlexGridBlockData & {
    alignmentForTeaserBlock: (index: number) => FlexAlignment;
  }
).alignmentForTeaserBlock = alignmentForTeaserBlock;
*/

export const Default = {
  args: mockFlexGridBlockData,
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
