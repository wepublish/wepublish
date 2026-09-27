import { render } from '@testing-library/react';
import { FullTeaserFragment } from '@wepublish/website/api';

import {
  joinAuthorNames,
  selectTeaserAuthors,
  selectTeaserAuthorsWithRole,
} from './base-teaser';
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

  const articleTeaser = (hideAuthor: boolean) =>
    ({
      __typename: 'ArticleTeaser',
      article: {
        latest: {
          hideAuthor,
          authors: [
            {
              role: null,
              author: { name: 'Visible Author', hideOnTeaser: false },
            },
            {
              role: 'Text',
              author: { name: 'Author With Role', hideOnTeaser: false },
            },
            {
              role: null,
              author: { name: 'Hidden Author', hideOnTeaser: true },
            },
          ],
        },
      },
    }) as unknown as FullTeaserFragment;

  describe('selectTeaserAuthors', () => {
    it('returns authors that are not hidden on teasers', () => {
      expect(selectTeaserAuthors(articleTeaser(false))).toEqual([
        'Visible Author',
        'Author With Role',
      ]);
    });

    it('returns no authors when the article hides its authors', () => {
      expect(selectTeaserAuthors(articleTeaser(true))).toBeNull();
    });
  });

  describe('selectTeaserAuthorsWithRole', () => {
    it('appends the role of every author that has one', () => {
      expect(selectTeaserAuthorsWithRole(articleTeaser(false))).toEqual([
        'Visible Author',
        'Author With Role (Text)',
      ]);
    });

    it('returns no authors when the article hides its authors', () => {
      expect(selectTeaserAuthorsWithRole(articleTeaser(true))).toBeNull();
    });
  });

  describe('joinAuthorNames', () => {
    it.each([
      [[], ''],
      [['A'], 'A'],
      [['A', 'B'], 'A und B'],
      [['A', 'B', 'C'], 'A, B und C'],
    ])('joins %j into "%s"', (authors, expected) => {
      expect(joinAuthorNames(authors, ', ', ' und ')).toBe(expected);
    });
  });
});
