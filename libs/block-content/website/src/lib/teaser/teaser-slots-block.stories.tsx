import { Meta } from '@storybook/react';
import { TeaserSlotsBlock } from './teaser-slots-block';
import { mockArticleTeaser } from '@wepublish/storybook/mocks';

export default {
  component: TeaserSlotsBlock,
  title: 'Blocks/Teaser Slots',
} as Meta;

const mockTeaserSlotsBlock = ({
  title = undefined,
  teasers = [mockArticleTeaser(), mockArticleTeaser(), mockArticleTeaser()],
  blockStyle = undefined,
  className = '',
  // Add required properties based on BuilderTeaserSlotsBlockProps
  autofillConfig = {
    strategy: 'manual',
    numberOfTeasers: 3,
    tagIds: [],
    maxAgeInDays: 30,
  },
  autofillTeasers = [],
  slots = [
    { id: '1', teaser: undefined, position: 0 },
    { id: '2', teaser: undefined, position: 1 },
    { id: '3', teaser: undefined, position: 2 },
  ],
} = {}) => ({
  title,
  teasers,
  blockStyle,
  className,
  autofillConfig,
  autofillTeasers,
  slots,
});

export const Default = {
  args: mockTeaserSlotsBlock(),
};

export const WithTitle = {
  args: {
    ...mockTeaserSlotsBlock(),
    title: 'Featured Stories',
  },
};

export const WithMixedContent = {
  args: mockTeaserSlotsBlock({
    teasers: [mockArticleTeaser(), mockArticleTeaser(), mockArticleTeaser()],
  }),
};

export const WithCustomStyle = {
  args: {
    ...mockTeaserSlotsBlock(),
    blockStyle: 'custom-style',
    title: 'Styled Teasers',
  },
};

export const WithCustomClass = {
  args: {
    ...mockTeaserSlotsBlock(),
    className: 'custom-teaser-slots',
    title: 'Custom Class',
  },
};
