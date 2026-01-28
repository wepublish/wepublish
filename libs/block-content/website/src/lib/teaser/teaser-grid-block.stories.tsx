import { Meta } from '@storybook/react';
import { TeaserGridBlock } from './teaser-grid-block';
import {
  mockArticleTeaser,
  mockTeaserGridBlock,
} from '@wepublish/storybook/mocks';

export default {
  component: TeaserGridBlock,
  title: 'Blocks/Teaser Grid',
} as Meta;

export const OneColumn = {
  args: mockTeaserGridBlock({ numColumns: 1, teasers: [mockArticleTeaser()] }),
};

export const ThreeColumns = {
  args: mockTeaserGridBlock(),
};
