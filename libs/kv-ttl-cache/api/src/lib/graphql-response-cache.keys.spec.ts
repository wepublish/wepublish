import { ApolloServer, HeaderMap } from '@apollo/server';
import { createCache } from 'cache-manager';
import {
  GraphqlResponseCachePlugin,
  PublicContentCacheInvalidator,
} from './graphql-response-cache.plugin';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

const typeDefs = `
  input ArticleFilter { title: String, tags: [String!] }
  type Poll { answers: [Int!]! }
  type PollBlock { poll: Poll }
  type Revision { title: String! }
  type Article {
    id: ID!
    title: String!
    blocks: [PollBlock!]!
    draft: Revision
    pending: Revision
  }
  type Image { id: ID! }
  type Query {
    article(id: ID!, filter: ArticleFilter): Article
    getImagesByTag(tag: String!): [Image!]!
  }
`;

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

const createApi = async () => {
  let resolved = 0;
  const kv = new KvTtlCacheService(createCache(), new FakeDragonfly());
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        article: (_: unknown, { id }: { id: string }) => ({
          id,
          title: `Title ${++resolved}`,
          blocks: [{ poll: { answers: [resolved] } }],
          draft: { title: `Draft ${resolved}` },
          pending: { title: `Pending ${resolved}` },
        }),
        getImagesByTag: () => [{ id: `image ${++resolved}` }],
      },
    },
    plugins: [new GraphqlResponseCachePlugin(kv)],
  });
  await server.start();

  const query = (source: string, variables?: Record<string, unknown>) =>
    server.executeOperation(
      {
        query: source,
        variables,
        http: {
          method: 'POST',
          headers: new HeaderMap(),
          search: '',
          body: {},
        },
      },
      { contextValue: { req: { query: {}, body: {} } } }
    );

  return { kv, query, resolved: () => resolved, stop: () => server.stop() };
};

describe('GraphQL answer keys', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores variables the operation does not declare', async () => {
    const api = await createApi();
    const source = 'query($id: ID!) { article(id: $id) { id title } }';

    await api.query(source, { id: '1' });
    await api.query(source, { id: '1', cacheBuster: Math.random() });
    await api.stop();

    expect(api.resolved()).toBe(1);
  });

  it('does not depend on the order of variables or their fields', async () => {
    const api = await createApi();
    const source =
      'query($id: ID!, $filter: ArticleFilter) { article(id: $id, filter: $filter) { id title } }';

    await api.query(source, { id: '1', filter: { title: 'a', tags: ['x'] } });
    await api.query(source, { filter: { tags: ['x'], title: 'a' }, id: '1' });
    await api.stop();

    expect(api.resolved()).toBe(1);
  });

  it('keeps answers with a poll for 30 s even when the client asks without __typename', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    const api = await createApi();
    const source = '{ article(id: "1") { id blocks { poll { answers } } } }';

    await api.query(source);
    vi.setSystemTime(START + 31_000);
    await api.query(source);
    await api.stop();

    expect(api.resolved()).toBe(2);
  });
});

describe('images by tag', () => {
  it('answers again after an image upload, which only resets the image cache', async () => {
    const api = await createApi();
    const source = '{ getImagesByTag(tag: "gallery") { id } }';

    await api.query(source);
    await api.query(source);
    await new Promise(resolve => setTimeout(resolve, 2));
    await new PublicContentCacheInvalidator(api.kv).invalidateDraft('images');
    await api.query(source);
    await api.stop();

    expect(api.resolved()).toBe(2);
  });
});

describe('drafts read by externals', () => {
  const editorSavesDraft = async (kv: KvTtlCacheService) => {
    await new Promise(resolve => setTimeout(resolve, 2));
    await new PublicContentCacheInvalidator(kv).invalidateDraft('articles');
  };

  it.each([
    ['a draft', '{ article(id: "1") { id draft { title } } }'],
    ['a pending revision', '{ article(id: "1") { id pending { title } } }'],
    [
      'a draft through a fragment',
      'query { article(id: "1") { ...Preview } } fragment Preview on Article { id draft { title } }',
    ],
    [
      'a draft under an alias',
      '{ article(id: "1") { id upcoming: draft { title } } }',
    ],
  ])(
    'answers again after a draft-only save when the answer shows %s',
    async (_, source) => {
      const api = await createApi();

      await api.query(source);
      await api.query(source);
      await editorSavesDraft(api.kv);
      await api.query(source);
      await api.stop();

      expect(api.resolved()).toBe(2);
    }
  );

  it('keeps answers without drafts across draft-only saves', async () => {
    const api = await createApi();
    const source = '{ article(id: "1") { id title } }';

    await api.query(source);
    await editorSavesDraft(api.kv);
    await api.query(source);
    await api.stop();

    expect(api.resolved()).toBe(1);
  });
});

describe('invalidateAt', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['an invalid date', new Date('not a date')],
    ['no date', null],
    ['undefined', undefined],
  ])('schedules nothing for %s', (_, at) => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const invalidator = new PublicContentCacheInvalidator(
      new KvTtlCacheService(createCache(), new FakeDragonfly())
    );

    expect(() =>
      invalidator.invalidateAt(at as Date, 'articles')
    ).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('invalidateReaderComments', () => {
  it('rebuilds only the commented article page, never the whole website', async () => {
    const kv = new KvTtlCacheService(createCache(), new FakeDragonfly());
    const paths = vi.spyOn(kv, 'resetWebsitePaths');
    const resets = vi.spyOn(kv, 'resetNamespace');

    await new PublicContentCacheInvalidator(kv).invalidateReaderComments(true, {
      id: 'a1',
      slug: 'one',
    });

    expect(paths).toHaveBeenCalledWith(['/a/one', '/a/id/a1']);
    expect(
      resets.mock.calls.every(
        ([namespace, options]) =>
          namespace !== 'graphql:content' || options?.pages === false
      )
    ).toBe(true);
  });
});
