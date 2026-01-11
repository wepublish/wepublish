import { Meta } from '@storybook/react';
import { FlexBlock } from './flex-block';
import { mockArticleTeaser } from '@wepublish/storybook/mocks';
export default {
  component: FlexBlock,
  title: 'Blocks/Flex Block',
} as Meta;

const mockTeaserSlotsBlock = ({
  title = 'test title',
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

const mockNestedBlock = ({
  alignment = {
    i: '',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    static: false,
  },
  block = mockTeaserSlotsBlock(),
} = {}) => ({
  alignment,
  block,
});

const mockFlexBock = ({
  blockStyle = null,
  blocks = [
    mockNestedBlock(),
    mockNestedBlock(),
    mockNestedBlock(),
    mockNestedBlock(),
    mockNestedBlock(),
    mockNestedBlock(),
    mockNestedBlock(),
  ],
} = {}) => ({
  blockStyle,
  blocks,
});

export const Default = {
  args: mockFlexBock(),
};
