import { ApolloClient } from '@apollo/client';
import { mockArticle } from '@wepublish/mocks/website';
import {
  ArticleSort,
  FeedArticleListDocument,
  SettingDocument,
  SortOrder,
} from '@wepublish/website/api';

import { queryFeed } from './query-feed';

const articles = [mockArticle({ id: 'a' })];

const clientAnswering = (setting: () => Promise<unknown>) => {
  const query = vi.fn(async ({ query: document }) =>
    document === SettingDocument ? setting() : (
      { data: { articles: { nodes: articles } } }
    )
  );

  return { client: { query } as unknown as ApolloClient, query };
};

const variables = {
  take: 50,
  sort: ArticleSort.PublishedAt,
  order: SortOrder.Descending,
};

describe('queryFeed', () => {
  it('loads the articles with the full-text document', async () => {
    const { client, query } = clientAnswering(async () => ({
      data: { setting: { value: 'full' } },
    }));

    const result = await queryFeed(client, variables);

    expect(query).toHaveBeenCalledWith({
      query: FeedArticleListDocument,
      variables,
    });
    expect(result.articles).toBe(articles);
  });

  it("reads the medium's paywall choice", async () => {
    const { client, query } = clientAnswering(async () => ({
      data: { setting: { value: 'visible' } },
    }));

    const { options } = await queryFeed(client, variables);

    expect(query).toHaveBeenCalledWith({
      query: SettingDocument,
      variables: { name: 'feedPaywalledContent' },
    });
    expect(options).toEqual({ paywalledContent: 'visible' });
  });

  it('falls back to the lead when the choice is not one it knows', async () => {
    const { client } = clientAnswering(async () => ({
      data: { setting: { value: 'everything' } },
    }));

    expect((await queryFeed(client, variables)).options).toEqual({
      paywalledContent: 'lead',
    });
  });

  it('falls back to the lead when the choice cannot be read', async () => {
    const { client } = clientAnswering(async () => {
      throw new Error('Setting not found');
    });

    expect((await queryFeed(client, variables)).options).toEqual({
      paywalledContent: 'lead',
    });
  });

  it('serves no articles when the query returned none', async () => {
    const query = vi.fn(async () => ({ data: undefined }));

    const result = await queryFeed(
      { query } as unknown as ApolloClient,
      variables
    );

    expect(result.articles).toEqual([]);
  });
});
