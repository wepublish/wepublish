import { ApolloClient } from '@apollo/client';
import { ArticleListDocument, TagDocument } from '@wepublish/website/api';

import { prefetchTag } from './tag-page';

const clientReturning = (tagResult: unknown) => {
  const query = vi
    .fn()
    .mockImplementation(({ query }) =>
      Promise.resolve(query === TagDocument ? tagResult : { data: {} })
    );

  return { client: { query } as unknown as ApolloClient, query };
};

describe('prefetchTag', () => {
  it('returns null without fetching articles when the api has no data', async () => {
    const { client, query } = clientReturning({ data: null });

    await expect(
      prefetchTag(client, { tag: '[object Object]' })
    ).resolves.toBeNull();
    expect(query).not.toHaveBeenCalledWith(
      expect.objectContaining({ query: ArticleListDocument })
    );
  });

  it('returns null when the tag does not exist', async () => {
    const { client } = clientReturning({ data: { tag: null } });

    await expect(prefetchTag(client, { tag: 'unknown' })).resolves.toBeNull();
  });

  it('prefetches the articles of an existing tag', async () => {
    const tag = { id: 'tag-1', tag: 'klima' };
    const { client, query } = clientReturning({ data: { tag } });

    await expect(prefetchTag(client, { tag: 'klima' })).resolves.toBe(tag);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: ArticleListDocument,
        variables: expect.objectContaining({ filter: { tags: ['tag-1'] } }),
      })
    );
  });
});
