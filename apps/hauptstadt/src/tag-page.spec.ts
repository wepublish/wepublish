// @vitest-environment node
import { PageDocument, TagDocument } from '@wepublish/website/api';
import { GetStaticPropsContext } from 'next';

import { getStaticProps } from '../pages/a/tag/[tag]';

const { client } = vi.hoisted(() => ({
  client: {
    query: vi.fn(),
    cache: { extract: () => ({}) },
  },
}));

vi.mock('@wepublish/website/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/website/api')>()),
  getApiClient: () => client,
}));

describe('Hauptstadt tag page', () => {
  it('keeps the tag filter when a page replaces the article list', async () => {
    client.query.mockImplementation(({ query }: { query: unknown }) =>
      Promise.resolve(
        query === TagDocument ?
          { data: { tag: { id: 'tag-1', tag: 'klima', pageId: 'page-1' } } }
        : query === PageDocument ? { data: { page: { id: 'page-1' } } }
        : { data: {} }
      )
    );

    const result = (await getStaticProps({
      params: { tag: 'klima' },
    } as unknown as GetStaticPropsContext)) as {
      props: { articleFilter: unknown };
    };

    expect(result.props.articleFilter).toEqual({ tags: ['tag-1'] });
  });
});
