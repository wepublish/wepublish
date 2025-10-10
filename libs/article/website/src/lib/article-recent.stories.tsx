import { Meta, StoryObj } from '@storybook/react';
import {
  ArticleDocument,
  ArticleListDocument,
  ArticleSort,
  SortOrder,
  TagListDocument,
  Tag,
  TagType,
} from '@wepublish/website/api';
import { ArticleRecent } from './article-recent';
import {
  mockArticle,
  mockArticleRevision,
  mockTag,
} from '@wepublish/storybook/mocks';
import { ComponentProps } from 'react';
import { within } from '@storybook/test';

const clickArticle: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const recentArticleTitle = canvas.getByText('Aktuelle Beiträge');

  if (recentArticleTitle && recentArticleTitle.parentElement) {
    const articles =
      recentArticleTitle.parentElement.querySelectorAll('article article');

    if (articles?.length > 0) {
      const lastArticle = articles[articles.length - 1];
      if (lastArticle) {
        const link = lastArticle.querySelector(':scope > a');
        if (link) {
          // navigation isn't implemented in test environment
          // ... so simulate the click
          //(link as HTMLAnchorElement).click();
          console.log(
            'Clicking article title:',
            link.querySelector('div > h1')?.textContent
          );
        }
      }
    } else {
      throw new Error('No articles found');
    }
  }
};

const mockTags = {
  tag1: mockTag({ id: '1', tag: 'tag-1' }),
  tag2: mockTag({ id: '2', tag: 'tag-2' }),
  tag3: mockTag({ id: '3', tag: 'tag-3' }),
  tag4: mockTag({ id: '4', tag: 'tag-4' }),
  tag5: mockTag({ id: '5', tag: 'tag-5' }),
  tag6: mockTag({ id: '6', tag: 'tag-6' }),
};

const mockArticles = {
  article1: mockArticle({
    id: 'article-id-1',
    slug: 'article-slug-1',
    tags: [mockTags.tag1],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-09-01T12:00:00Z').toDateString(),
      title: 'Some longer article 1 title: How will it look like?',
    }),
  }),
  article2: mockArticle({
    id: 'article-id-2',
    slug: 'article-slug-2',
    tags: [mockTags.tag2, mockTags.tag6],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-08-01T12:00:00Z').toDateString(),
      title: 'Some longer article 2 title: How will it look like?',
    }),
  }),
  article3: mockArticle({
    id: 'article-id-3',
    slug: 'article-slug-3',
    tags: [mockTags.tag5, mockTags.tag4, mockTags.tag3],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-08-01T12:00:00Z').toDateString(),
      title: 'Some longer article 3 title: How will it look like?',
    }),
  }),
  article4: mockArticle({
    id: 'article-id-4',
    slug: 'article-slug-4',
    tags: [mockTags.tag4],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-09-01T12:00:00Z').toDateString(),
      title: 'Some longer article 4 title: How will it look like?',
    }),
  }),
  article5: mockArticle({
    id: 'article-id-5',
    slug: 'article-slug-5',
    tags: [mockTags.tag6, mockTags.tag3],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-07-01T12:00:00Z').toDateString(),
      title: 'Some longer article 5 title: How will it look like?',
    }),
  }),
  article6: mockArticle({
    id: 'article-id-6',
    slug: 'article-slug-6',
    tags: [mockTags.tag5, mockTags.tag3],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-06-01T12:00:00Z').toDateString(),
      title: 'Some longer article 6 title: How will it look like?',
    }),
  }),
  article7: mockArticle({
    id: 'article-id-7',
    slug: 'article-slug-7',
    tags: [mockTags.tag5, mockTags.tag6],
    latest: mockArticleRevision({
      publishedAt: new Date('2025-05-01T12:00:00Z').toDateString(),
      title: 'Some longer article 7 title: How will it look like?',
    }),
  }),
  article8: mockArticle({
    id: 'article-id-8',
    slug: 'article-slug-8',
    tags: [],
    latest: mockArticleRevision({
      title: 'Some longer article 8 title: How will it look like?',
      publishedAt: new Date('2024-08-01T12:00:00Z').toDateString(),
    }),
  }),
  article9: mockArticle({
    id: 'article-id-9',
    slug: 'article-slug-9',
    tags: [mockTags.tag5],
    latest: mockArticleRevision({
      title: 'Some longer article 9 title: How will it look like?',
      publishedAt: new Date('2024-08-01T12:00:00Z').toDateString(),
    }),
  }),
  article10: mockArticle({
    id: 'article-id-10',
    slug: 'article-slug-10',
    tags: [mockTags.tag1],
    latest: mockArticleRevision({
      title: 'Some longer article 10 title: How will it look like?',
      publishedAt: new Date('2025-09-03T12:00:00Z').toDateString(),
    }),
  }),
  article11: mockArticle({
    id: 'article-id-11',
    slug: 'article-slug-11',
    tags: [mockTags.tag4],
    publishedAt: new Date('2024-08-01T12:00:00Z').toDateString(),
  }),
};

const excludeTags = [mockTags.tag2.tag, mockTags.tag4.tag] as string[];

const nrOfRecentArticles = 4;

/*
const Render = (args: any) => {
  return (
    <ArticleRecent {...(args as ComponentProps<typeof ArticleRecent>)}>


      <ArticleListContainer
        variables={{
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
          take: nrOfRecentArticles + 1,
          filter: {
            tagsNotIn:
              args.excludeTags ? [mockTags.tag2.id, mockTags.tag4.id] : [],
          },
        }}
        filter={articles =>
          articles
            .filter(article => article.id !== args.article.id)
            .splice(0, nrOfRecentArticles)
        }
      />
    </ArticleRecent>
  );
};
*/

const Render = (args: any) => {
  return <ArticleRecent {...(args as ComponentProps<typeof ArticleRecent>)} />;
};

const Default = {
  component: ArticleRecent,
  title: 'Article/Article with Recent Articles List',
} as Meta;

export default Default;

export const NavigateLastArticle: StoryObj<typeof ArticleRecent> = {
  render: Render,
  args: {
    article: mockArticles.article1,
    excludeTags,
    nrOfRecentArticles,
  },
  play: async ctx => {
    await clickArticle(ctx);
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: TagListDocument,
            variables: {
              filter: {
                tags: excludeTags,
                type: TagType.Article,
              },
              take: 100,
            },
          },
          result: {
            data: {
              tags: {
                nodes: [mockTags.tag2, mockTags.tag4],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null,
                },
                totalCount: 2,
              },
            },
          },
        },
        {
          request: {
            query: ArticleListDocument,
            variables: {
              sort: ArticleSort.PublishedAt,
              order: SortOrder.Descending,
              take: nrOfRecentArticles + 1,
              filter: {
                tagsNotIn: [mockTags.tag2, mockTags.tag4].map(
                  (tag: Tag) => tag.id
                ),
              },
            },
          },
          result: {
            data: {
              articles: {
                nodes: [
                  mockArticles.article10,
                  mockArticles.article1,
                  mockArticles.article5,
                  mockArticles.article6,
                  mockArticles.article7,
                ],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null,
                },
                totalCount: 11,
              },
            },
          },
        },
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: mockArticles.article1.id,
              slug: mockArticles.article1.slug,
            },
          },
          result: {
            data: {
              article: mockArticles.article1,
            },
          },
        },
      ],
    },
  },
};
