import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockArticleTeaser,
  mockAuthor,
} from '@wepublish/storybook/mocks';

import {
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

  describe('aria-label', () => {
    const { Default: ArticleTeaser } = articleStoriesCmp;

    const teaserWith = ({
      title,
      lead,
      authors,
    }: {
      title?: string | null;
      lead?: string | null;
      authors?: string[];
    }) =>
      mockArticleTeaser({
        title,
        lead,
        article: mockArticle({
          latest: mockArticleRevision({
            blocks: [],
            lead: null,
            authors: (authors ?? []).map(name =>
              mockArticleRevisionAuthor({
                author: { ...mockAuthor(), name },
              })
            ),
          }),
        }),
      });

    it('should contain the title, the lead and the authors', () => {
      render(
        <ArticleTeaser
          teaser={teaserWith({
            title: 'Teaser Title',
            lead: 'Teaser Lead',
            authors: ['Jane Doe', 'John Doe'],
          })}
        />
      );

      expect(
        screen.getByRole('link', {
          name: 'Teaser Title. Teaser Lead. Von Jane Doe, John Doe',
        })
      ).toBeInTheDocument();
    });

    it('should omit the parts the teaser does not have', () => {
      render(
        <ArticleTeaser
          teaser={teaserWith({
            title: 'Teaser Title',
            lead: null,
            authors: [],
          })}
        />
      );

      expect(
        screen.getByRole('link', { name: 'Teaser Title.' })
      ).toBeInTheDocument();
    });
  });
});
