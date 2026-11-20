// @vitest-environment node
import {
  ArticleListDocument,
  PageDocument,
  TagDocument,
} from '@wepublish/website/api';
import { GetStaticPropsContext } from 'next';

import { TagPageGetStaticProps } from './tag-page';

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

const answer = (tag: unknown, page?: unknown) =>
  client.query.mockImplementation(({ query }: { query: unknown }) =>
    Promise.resolve(
      query === TagDocument ? { data: { tag } }
      : query === PageDocument ? { data: { page } }
      : { data: {} }
    )
  );

const staticProps = () =>
  TagPageGetStaticProps({
    params: { tag: 'klima' },
  } as unknown as GetStaticPropsContext) as Promise<{
    props?: Record<string, unknown>;
    notFound?: boolean;
  }>;

const queried = (document: unknown) =>
  client.query.mock.calls.filter(([{ query }]) => query === document);

describe('TagPageGetStaticProps', () => {
  beforeEach(() => {
    client.query.mockReset();
  });

  it('prefetches the articles of the tag', async () => {
    answer({ id: 'tag-1', tag: 'klima', pageId: null });

    const result = await staticProps();

    expect(queried(ArticleListDocument)).toEqual([
      [
        expect.objectContaining({
          variables: expect.objectContaining({ filter: { tags: ['tag-1'] } }),
        }),
      ],
    ]);
    expect(queried(PageDocument)).toEqual([]);
    expect(result.props).not.toHaveProperty('shell');
  });

  it('prefetches the page chosen for the tag instead of its articles', async () => {
    answer(
      { id: 'tag-1', tag: 'klima', pageId: 'page-1' },
      { id: 'page-1', hideHeader: true, hideFooter: false }
    );

    const result = await staticProps();

    expect(queried(PageDocument)).toEqual([
      [expect.objectContaining({ variables: { id: 'page-1' } })],
    ]);
    expect(queried(ArticleListDocument)).toEqual([]);
    expect(result.props).toMatchObject({
      tag: 'klima',
      shell: { showNavigation: false, showFooter: true },
    });
  });

  it('answers 404 for an unknown tag', async () => {
    answer(null);

    await expect(staticProps()).resolves.toMatchObject({ notFound: true });
  });
});
