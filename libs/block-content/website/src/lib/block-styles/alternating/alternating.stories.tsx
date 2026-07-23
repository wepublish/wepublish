import { Meta } from '@storybook/nextjs-vite';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleTeaser,
  mockTeaserGridBlock,
} from '@wepublish/storybook/mocks';
import { AlternatingTeaserGridBlock } from './alternating-teaser-grid';

export default {
  component: AlternatingTeaserGridBlock,
  title: 'Blocks/Break/Block Styles/Alternating',
} as Meta;

export const Teaser = {
  args: mockTeaserGridBlock({
    numColumns: 6,
    blockStyle: 'Alternating',
    teasers: [
      mockArticleTeaser(),
      mockArticleTeaser({
        preTitle: null,
        article: mockArticle({
          tags: [],
          latest: mockArticleRevision({
            preTitle: null,
          }),
        }),
      }),
      mockArticleTeaser({
        preTitle: null,
        article: mockArticle({
          tags: [],
          latest: mockArticleRevision({
            preTitle: null,
          }),
        }),
      }),
      mockArticleTeaser(),
    ],
  }),
};
