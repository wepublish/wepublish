import { ApolloServer, HeaderMap } from '@apollo/server';
import { createCache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';
import {
  GraphqlResponseCachePlugin,
  PUBLIC_CONTENT_NAMESPACE,
  PublicContentCacheInvalidator,
} from './graphql-response-cache.plugin';
import { MemoryAtomicStore } from './kv-ttl-cache-atomic-store';

const typeDefs = `
  type Article { id: ID!, title: String! }
  type Query {
    article(id: ID!): Article
    challenge: String!
    me: String
    navigations: [String!]!
    peerProfile: String!
    commentsForItem(itemId: ID!): [String!]!
  }
  type Mutation { tags: String! }
`;

type Request = {
  headers?: Record<string, string>;
  search?: string;
  body?: Record<string, unknown>;
};

const createApi = async (dragonfly: FakeDragonfly) => {
  const calls = {
    article: 0,
    challenge: 0,
    me: 0,
    tags: 0,
    navigations: 0,
    peerProfile: 0,
    commentsForItem: 0,
  };
  let failNext = false;
  const kv = new KvTtlCacheService(createCache(), dragonfly);
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        article: (_: unknown, { id }: { id: string }) => {
          calls.article++;

          if (failNext) {
            failNext = false;
            throw new Error('database down');
          }

          return { id, title: `Title ${calls.article}` };
        },
        challenge: () => `challenge ${++calls.challenge}`,
        me: () => `me ${++calls.me}`,
        navigations: () => [`main ${++calls.navigations}`],
        peerProfile: () => `profile ${++calls.peerProfile}`,
        commentsForItem: () => [`comment ${++calls.commentsForItem}`],
      },
      Mutation: {
        tags: () => `tags ${++calls.tags}`,
      },
    },
    plugins: [new GraphqlResponseCachePlugin(kv)],
  });
  await server.start();

  const query = async (
    source: string,
    { headers = {}, search = '', body = {} }: Request = {},
    variables?: Record<string, unknown>
  ) => {
    const response = await server.executeOperation(
      {
        query: source,
        variables,
        http: {
          method: 'POST',
          headers: new HeaderMap(Object.entries(headers)),
          search,
          body,
        },
      },
      { contextValue: { req: { query: {}, body } } }
    );

    return response.body.kind === 'single' ?
        response.body.singleResult
      : undefined;
  };

  return {
    kv,
    calls,
    query,
    failOnce: () => (failNext = true),
    stop: () => server.stop(),
  };
};

const ARTICLE = '{ article(id: "1") { id title } }';

describe('GraphqlResponseCachePlugin', () => {
  const apis: Array<Awaited<ReturnType<typeof createApi>>> = [];
  const start = async (dragonfly = new FakeDragonfly()) => {
    const api = await createApi(dragonfly);
    apis.push(api);

    return api;
  };

  afterEach(async () => {
    await Promise.all(apis.splice(0).map(api => api.stop()));
  });

  it('answers a repeated anonymous query from the cache', async () => {
    const api = await start();

    const first = await api.query(ARTICLE);
    const second = await api.query(ARTICLE);

    expect(api.calls.article).toBe(1);
    expect(second).toEqual(first);
  });

  it('shares cached answers between api replicas', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await start(dragonfly);
    const second = await start(dragonfly);

    await first.query(ARTICLE);
    await second.query(ARTICLE);

    expect(first.calls.article + second.calls.article).toBe(1);
  });

  it.each<[string, Request]>([
    ['an Authorization header', { headers: { authorization: 'Bearer s1' } }],
    ['an access_token in the url', { search: 'access_token=s1' }],
    ['an access_token in the body', { body: { access_token: 's1' } }],
    ['a preview header', { headers: { preview: 'true' } }],
  ])('never caches a request with %s', async (_, request) => {
    const api = await start();

    await api.query(ARTICLE, request);
    await api.query(ARTICLE, request);
    await api.query(ARTICLE);

    expect(api.calls.article).toBe(3);
  });

  describe('for logged-in requests', () => {
    const LOGGED_IN = { headers: { authorization: 'Bearer s1' } };
    const NAVIGATION = '{ navigations peerProfile }';

    it('answers navigations and peer profile from the anonymous cache', async () => {
      const api = await start();

      const anonymous = await api.query(NAVIGATION);
      const loggedIn = await api.query(NAVIGATION, LOGGED_IN);

      expect(loggedIn).toEqual(anonymous);
      expect(api.calls.navigations).toBe(1);
    });

    it('never stores an answer computed for a logged-in user', async () => {
      const api = await start();

      await api.query(NAVIGATION, LOGGED_IN);
      await api.query(NAVIGATION);

      expect(api.calls.navigations).toBe(2);
    });

    it('does not read the cache for preview requests', async () => {
      const api = await start();

      await api.query(NAVIGATION);
      await api.query(NAVIGATION, {
        headers: { authorization: 'Bearer s1', preview: 'true' },
      });

      expect(api.calls.navigations).toBe(2);
    });

    it('does not read the cache for other queries', async () => {
      const api = await start();

      await api.query('{ navigations article(id: "1") { id } }');
      await api.query('{ navigations article(id: "1") { id } }', LOGGED_IN);

      expect(api.calls.article).toBe(2);
    });
  });

  it('keeps an answer for five minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });

    try {
      const api = await start();

      await api.query(ARTICLE);
      vi.advanceTimersByTime(299_000);
      await api.query(ARTICLE);

      expect(api.calls.article).toBe(1);

      vi.advanceTimersByTime(3_000);
      await api.query(ARTICLE);

      expect(api.calls.article).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never caches a query that is not on the list', async () => {
    const api = await start();

    await api.query('{ challenge }');
    const second = await api.query('{ challenge }');

    expect(second?.data).toEqual({ challenge: 'challenge 2' });
  });

  it('never caches a query that mixes listed and unlisted fields', async () => {
    const api = await start();

    await api.query('{ article(id: "1") { id } me }');
    await api.query('{ article(id: "1") { id } me }');

    expect(api.calls.me).toBe(2);
  });

  it('never caches mutations', async () => {
    const api = await start();

    await api.query('mutation { tags }');
    await api.query('mutation { tags }');

    expect(api.calls.tags).toBe(2);
  });

  it('never caches an answer with errors', async () => {
    const api = await start();

    api.failOnce();
    await api.query(ARTICLE);
    const second = await api.query(ARTICLE);

    expect(second?.errors).toBeUndefined();
    expect(api.calls.article).toBe(2);
  });

  it('keeps answers for different variables apart', async () => {
    const api = await start();
    const byId = 'query ($id: ID!) { article(id: $id) { id } }';

    await api.query(byId, {}, { id: '1' });
    const second = await api.query(byId, {}, { id: '2' });

    expect(second?.data).toEqual({ article: { id: '2' } });
  });

  it('answers from the resolvers again once content was published', async () => {
    const api = await start();

    await api.query(ARTICLE);
    await new PublicContentCacheInvalidator(api.kv).invalidate();
    await api.query(ARTICLE);

    expect(api.calls.article).toBe(2);
  });

  it.each([PUBLIC_CONTENT_NAMESPACE, 'navigations', 'banners', 'settings'])(
    'answers from the resolvers again once %s changed',
    async namespace => {
      const api = await start();

      await api.query(ARTICLE);
      await api.kv.resetNamespace(namespace);
      await api.query(ARTICLE);

      expect(api.calls.article).toBe(2);
    }
  );

  it('caches comments for anonymous visitors', async () => {
    const api = await start();

    await api.query('{ commentsForItem(itemId: "1") }');
    await api.query('{ commentsForItem(itemId: "1") }');

    expect(api.calls.commentsForItem).toBe(1);
  });

  it('retires only comment answers once comments changed', async () => {
    const api = await start();
    const comments = '{ commentsForItem(itemId: "1") }';

    await api.query(comments);
    await api.query(ARTICLE);
    await new PublicContentCacheInvalidator(api.kv).invalidateComments();
    await api.query(comments);
    await api.query(ARTICLE);

    expect(api.calls.commentsForItem).toBe(2);
    expect(api.calls.article).toBe(1);
  });
});

describe('PublicContentCacheInvalidator', () => {
  const setup = () => {
    const kv = new KvTtlCacheService(createCache(), new MemoryAtomicStore());

    return { kv, invalidator: new PublicContentCacheInvalidator(kv) };
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the cached content it is told about', async () => {
    const { kv, invalidator } = setup();
    const loader = vi.fn().mockResolvedValue({ id: 'a' });

    await kv.getOrLoadNs('content:articles', 'a', loader, 60);
    await invalidator.invalidate('articles');
    await kv.getOrLoadNs('content:articles', 'a', loader, 60);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('retires anonymous answers again once other replicas caught up', async () => {
    vi.useFakeTimers();
    const { kv, invalidator } = setup();

    await invalidator.invalidate('articles');
    const right = await kv.getNamespaceVersion(PUBLIC_CONTENT_NAMESPACE);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(
      kv.getNamespaceVersion(PUBLIC_CONTENT_NAMESPACE)
    ).resolves.not.toBe(right);
  });

  it('leaves anonymous answers alone for draft changes', async () => {
    const { kv, invalidator } = setup();
    const before = await kv.getNamespaceVersion(PUBLIC_CONTENT_NAMESPACE);
    const draftsBefore = await kv.getNamespaceVersion('content:articles');

    await invalidator.invalidateDraft('articles');

    await expect(
      kv.getNamespaceVersion(PUBLIC_CONTENT_NAMESPACE)
    ).resolves.toBe(before);
    await expect(kv.getNamespaceVersion('content:articles')).resolves.not.toBe(
      draftsBefore
    );
  });
});
