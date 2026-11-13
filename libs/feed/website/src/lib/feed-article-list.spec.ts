import {
  mockArticle,
  mockArticleRevision,
  mockPaywall,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTitleBlock,
} from '@wepublish/mocks/website';
import {
  ArticleListDocument,
  FeedArticleListDocument,
  FeedArticleListQuery,
} from '@wepublish/website/api';
import { buildSchema, DocumentNode, execute } from 'graphql';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateFeed } from './feed-generator';

const schema = buildSchema(
  readFileSync(
    join(__dirname, '../../../../../apps/api-example/schema-v2.graphql'),
    'utf-8'
  )
);

const free = mockArticle({
  id: 'free',
  latest: mockArticleRevision({
    lead: 'Free lead',
    blocks: [
      mockTitleBlock({ title: 'Free title', lead: null, preTitle: null }),
      mockRichTextBlock({ richText: mockRichTextParagraph('Free body') }),
    ],
  }),
});

const gated = mockArticle({
  id: 'gated',
  paywall: mockPaywall({ active: true }),
  latest: mockArticleRevision({
    lead: 'Gated lead',
    blocks: [
      mockRichTextBlock({ richText: mockRichTextParagraph('Gated body') }),
    ],
  }),
});

const rootValue = {
  articles: {
    nodes: [free, gated],
    totalCount: 2,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  },
};

const articlesSelectedBy = async (document: DocumentNode) => {
  const result = await execute({ schema, document, rootValue });

  expect(result.errors).toBeUndefined();

  return (result.data as unknown as FeedArticleListQuery).articles.nodes;
};

const generate = generateFeed({
  id: 'https://example.com',
  title: 'Feed',
  copyright: 'Feed',
});

describe('the document the feeds query', () => {
  it('carries the body of a free article and only the lead of a paywalled one', async () => {
    const feed = await generate(
      await articlesSelectedBy(FeedArticleListDocument)
    );
    const items: { id: string; content_html: string }[] = JSON.parse(
      feed.json1()
    ).items;

    expect(items.map(item => item.content_html)).toEqual([
      '<h2>Free title</h2><p>Free body</p>',
      'Gated lead',
    ]);
  });

  it('is not the list document, which has neither blocks nor paywall state', async () => {
    const [article] = await articlesSelectedBy(ArticleListDocument);

    expect(article.latest).not.toHaveProperty('blocks');
    expect(article.paywall ?? {}).not.toHaveProperty('active');
  });
});
