import { Meta } from '@storybook/react';
import { TabbedContent } from './tabbed-content';
import { TeaserSlotsBlock } from '../../teaser/teaser-slots-block';
import { mockArticleTeaser } from '@wepublish/storybook/mocks';
export default {
  component: TabbedContent,
  title: 'Blocks/Flex Block/Block Styles/Tabbed Content',
} as Meta;

const mockTeaserSlotsBlock = ({
  title = undefined,
  teasers = [
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
  ],
  blockStyle = undefined,
  className = '',
  autofillConfig = {
    strategy: 'manual',
    numberOfTeasers: 7,
    tagIds: [],
    maxAgeInDays: 30,
  },
  autofillTeasers = [],
  slots = [
    { id: '1', teaser: undefined, position: 0 },
    { id: '2', teaser: undefined, position: 1 },
    { id: '3', teaser: undefined, position: 2 },
    { id: '4', teaser: undefined, position: 2 },
    { id: '5', teaser: undefined, position: 2 },
    { id: '6', teaser: undefined, position: 2 },
    { id: '7', teaser: undefined, position: 2 },
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

const mockNestedBlock = (block: typeof TeaserSlotsBlock) => ({
  alignment: {
    i: '',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    static: false,
  },
  block,
});

const mockTabbedContentBock = () => ({
  blockStyle: 'TabbedContent',
  nestedBlocks: [
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
    mockNestedBlock(
      mockTeaserSlotsBlock() as unknown as typeof TeaserSlotsBlock
    ),
  ],
});

export const Default = {
  args: mockTabbedContentBock(),
};
