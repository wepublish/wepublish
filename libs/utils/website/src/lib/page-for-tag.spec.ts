import { ApolloClient } from '@apollo/client';
import { PageDocument } from '@wepublish/website/api';

import { prefetchPageForTag } from './page-for-tag';

const clientReturning = (page: unknown) => {
  const query = vi.fn().mockResolvedValue({ data: { page } });

  return { client: { query } as unknown as ApolloClient, query };
};

describe('prefetchPageForTag', () => {
  it('loads nothing for a tag that shows its articles', async () => {
    const { client, query } = clientReturning(null);

    await expect(
      prefetchPageForTag(client, { pageId: null })
    ).resolves.toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('loads the page chosen for the tag', async () => {
    const { client, query } = clientReturning({ id: 'page-1' });

    await expect(
      prefetchPageForTag(client, { pageId: 'page-1' })
    ).resolves.toMatchObject({ page: { data: { page: { id: 'page-1' } } } });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: PageDocument,
        variables: { id: 'page-1' },
      })
    );
  });

  it('hides header and footer when the page does', async () => {
    const { client } = clientReturning({
      id: 'page-1',
      hideHeader: true,
      hideFooter: false,
    });

    await expect(
      prefetchPageForTag(client, { pageId: 'page-1' })
    ).resolves.toMatchObject({
      shell: { showNavigation: false, showFooter: true },
    });
  });
});
