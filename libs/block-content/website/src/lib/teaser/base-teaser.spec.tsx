import { render } from '@testing-library/react';
import { FullTeaserFragment } from '@wepublish/website/api';

import { selectTeaserAuthors } from './base-teaser';
import * as stories from './base-teaser.stories';
import * as articleStories from './base-teaser.article.stories';
import * as pageStories from './base-teaser.page.stories';
import * as eventStories from './base-teaser.event.stories';
import * as customStories from './base-teaser.custom.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);
const customStoriesCmp = composeStories(customStories);
const articleStoriesCmp = composeStories(articleStories);
const pageStoriesCmp = composeStories(pageStories);
const eventStoriesCmp = composeStories(eventStories);

describe('Teaser', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  describe('Custom', () => {
    Object.entries(customStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });

  describe('Article', () => {
    Object.entries(articleStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });

  describe('Page', () => {
    Object.entries(pageStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });

  describe('Event', () => {
    Object.entries(eventStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        render(<Component />);
      });
    });
  });

  describe('selectTeaserAuthors', () => {
    const articleTeaser = (hideAuthor: boolean) =>
      ({
        __typename: 'ArticleTeaser',
        article: {
          latest: {
            hideAuthor,
            authors: [
              { name: 'Visible Author', hideOnTeaser: false },
              { name: 'Hidden Author', hideOnTeaser: true },
            ],
          },
        },
      }) as unknown as FullTeaserFragment;

    it('returns authors that are not hidden on teasers', () => {
      expect(selectTeaserAuthors(articleTeaser(false))).toEqual([
        'Visible Author',
      ]);
    });

    it('returns no authors when the article hides its authors', () => {
      expect(selectTeaserAuthors(articleTeaser(true))).toBeNull();
    });
  });
});
