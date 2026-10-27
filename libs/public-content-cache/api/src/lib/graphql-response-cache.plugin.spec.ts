import { ApolloServer, HeaderMap } from '@apollo/server';
import { Test, type TestingModule } from '@nestjs/testing';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  NamespacedCache,
  NamespaceResets,
  NamespaceVersions,
} from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WebsitePathsSignal } from '@wepublish/website-revalidation/api';
import { GraphqlResponseCachePlugin } from './graphql-response-cache.plugin';
import { PublicContentCacheInvalidator } from './public-content-cache-invalidator';
import { PublicContentCacheModule } from './public-content-cache.module';
import {
  PUBLIC_CONTENT_NAMESPACE,
  PUBLIC_CONTENT_SHARED_NAMESPACES,
} from './public-content-namespaces';
import { skipAnswerCache } from './skip-answer-cache';

const { spans } = vi.hoisted(() => ({
  spans: [] as Array<{
    options: Record<string, unknown>;
    attributes: Record<string, unknown>;
  }>,
}));

vi.mock('@sentry/nestjs', () => ({
  startSpan: vi.fn(
    (
      options: Record<string, unknown> & {
        attributes?: Record<string, unknown>;
      },
      callback: (span: unknown) => unknown
    ) => {
      const attributes = { ...options.attributes };
      spans.push({ options, attributes });

      return callback({
        setAttribute: (key: string, value: unknown) => {
          attributes[key] = value;
        },
      });
    }
  ),
}));

const typeDefs = `
  type PollBlock { disabled: Boolean }
  type CrowdfundingBlock { disabled: Boolean }
  type RichTextBlock { text: String }
  union Block = PollBlock | CrowdfundingBlock | RichTextBlock
  type Article { id: ID!, title: String!, blocks: [Block!]! }
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

const BLOCKS: Record<string, Array<{ kind: string; disabled?: boolean }>> = {
  poll: [{ kind: 'PollBlock', disabled: false }],
  crowdfunding: [{ kind: 'CrowdfundingBlock' }],
  'poll-off': [{ kind: 'PollBlock', disabled: true }],
};

type Request = {
  headers?: Record<string, string>;
  search?: string;
  body?: Record<string, unknown>;
};

const modules: TestingModule[] = [];

const createReplica = async (dragonfly: FakeDragonfly) => {
  const module = await Test.createTestingModule({
    imports: [
      NamespacedCacheTestingModule.forRoot({
        connection: dragonfly,
        sharedNamespaces: PUBLIC_CONTENT_SHARED_NAMESPACES,
      }),
      PublicContentCacheModule,
    ],
  }).compile();
  await module.init();
  modules.push(module);

  return {
    module,
    cache: module.get(NamespacedCache),
    resets: module.get(NamespaceResets),
    versions: module.get(NamespaceVersions),
    paths: module.get(WebsitePathsSignal),
    invalidator: module.get(PublicContentCacheInvalidator),
    plugin: module.get(GraphqlResponseCachePlugin),
  };
};

const closeReplicas = () =>
  Promise.all(modules.splice(0).map(module => module.close()));

const createApi = async (dragonfly: FakeDragonfly) => {
  const replica = await createReplica(dragonfly);
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
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        article: (_: unknown, { id }: { id: string }, context: object) => {
          calls.article++;

          if (id === 'not-to-store') {
            skipAnswerCache(context);
          }

          if (failNext) {
            failNext = false;
            throw new Error('database down');
          }

          return {
            id,
            title: `Title ${calls.article}`,
            blocks: BLOCKS[id] ?? [{ kind: 'RichTextBlock', text: 'text' }],
          };
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
      Block: {
        __resolveType: (block: { kind: string }) => block.kind,
      },
    },
    plugins: [replica.plugin],
  });
  await server.start();

  const execute = (
    source: string,
    { headers = {}, search = '', body = {} }: Request = {},
    variables?: Record<string, unknown>
  ) =>
    server.executeOperation(
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

  const query = async (
    source: string,
    request: Request = {},
    variables?: Record<string, unknown>
  ) => {
    const response = await execute(source, request, variables);

    return response.body.kind === 'single' ?
        response.body.singleResult
      : undefined;
  };

  return {
    ...replica,
    calls,
    execute,
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

  beforeEach(() => {
    spans.length = 0;
  });

  afterEach(async () => {
    await Promise.all(apis.splice(0).map(api => api.stop()));
    await closeReplicas();
  });

  it('answers a repeated anonymous query from the cache', async () => {
    const api = await start();

    const first = await api.query(ARTICLE);
    const second = await api.query(ARTICLE);

    expect(api.calls.article).toBe(1);
    expect(second).toEqual(first);
  });

  it('answers from the cache without a status or headers of its own', async () => {
    const api = await start();

    const first = await api.execute(ARTICLE);
    const second = await api.execute(ARTICLE);

    expect(api.calls.article).toBe(1);
    expect(second.http.status).toBeUndefined();
    expect([...second.http.headers.entries()]).toEqual([
      ...first.http.headers.entries(),
    ]);
  });

  it('shares cached answers between api replicas', async () => {
    const dragonfly = new FakeDragonfly();
    const first = await start(dragonfly);
    const second = await start(dragonfly);

    await first.query(ARTICLE);
    await second.query(ARTICLE);

    expect(first.calls.article + second.calls.article).toBe(1);
  });

  it('traces anonymous GraphQL answers served from the cache', async () => {
    const api = await start();

    await api.query(ARTICLE);
    await api.query(ARTICLE);

    const answers = spans.filter(
      ({ options }) => options['name'] === 'graphql:responses'
    );
    expect(answers.map(({ attributes }) => attributes['cache.hit'])).toEqual([
      false,
      true,
    ]);
    expect(api.calls.article).toBe(1);
  });

  it('reads no separate version for the answers themselves', async () => {
    const dragonfly = new FakeDragonfly();
    const api = await start(dragonfly);

    await api.query(ARTICLE);
    await api.query(ARTICLE);

    expect(
      dragonfly.commands.filter(command =>
        command.includes('nsv:graphql:responses')
      )
    ).toEqual([]);
  });

  it.each<[string, Request]>([
    ['an Authorization header', { headers: { authorization: 'Bearer s1' } }],
    ['an access_token in the url', { search: 'access_token=s1' }],
    ['an access_token in the body', { body: { access_token: 's1' } }],
    [
      'a login and a preview header',
      { headers: { authorization: 'Bearer s1', preview: 'true' } },
    ],
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

  it.each(['poll', 'crowdfunding'])(
    'keeps an answer with a live %s for 30 seconds only',
    async id => {
      vi.useFakeTimers({ toFake: ['Date'] });

      try {
        const api = await start();
        const live = `{ article(id: "${id}") { id blocks { __typename ... on PollBlock { disabled } ... on CrowdfundingBlock { disabled } } } }`;

        await api.query(live);
        vi.advanceTimersByTime(29_000);
        await api.query(live);

        expect(api.calls.article).toBe(1);

        vi.advanceTimersByTime(3_000);
        await api.query(live);

        expect(api.calls.article).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('keeps an answer with a switched-off poll for five minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });

    try {
      const api = await start();
      const off =
        '{ article(id: "poll-off") { id blocks { __typename ... on PollBlock { disabled } } } }';

      await api.query(off);
      vi.advanceTimersByTime(299_000);
      await api.query(off);

      expect(api.calls.article).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores a preview header without a login, since only editors can preview', async () => {
    const api = await start();

    await api.query(ARTICLE, { headers: { preview: 'true' } });
    await api.query(ARTICLE, { headers: { preview: 'anything' } });
    await api.query(ARTICLE);

    expect(api.calls.article).toBe(1);
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

  it('never caches an answer a resolver marked as not to be stored', async () => {
    const api = await start();
    const NOT_TO_STORE = '{ article(id: "not-to-store") { id title } }';

    const first = await api.query(NOT_TO_STORE);
    await api.query(NOT_TO_STORE);

    expect(first?.errors).toBeUndefined();
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
    await api.invalidator.invalidate();
    await api.query(ARTICLE);

    expect(api.calls.article).toBe(2);
  });

  it.each([PUBLIC_CONTENT_NAMESPACE, 'navigations', 'banners', 'settings'])(
    'answers from the resolvers again once %s changed',
    async namespace => {
      const api = await start();

      await api.query(ARTICLE);
      await api.resets.reset(namespace);
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
    await api.invalidator.invalidateComments();
    await api.query(comments);
    await api.query(ARTICLE);

    expect(api.calls.commentsForItem).toBe(2);
    expect(api.calls.article).toBe(1);
  });
});

describe('PublicContentCacheInvalidator', () => {
  const setup = (dragonfly = new FakeDragonfly()) => createReplica(dragonfly);

  afterEach(async () => {
    await closeReplicas();
    vi.useRealTimers();
  });

  it('clears the cached content it is told about', async () => {
    const { cache, invalidator } = await setup();
    const loader = vi.fn().mockResolvedValue({ id: 'a' });

    await cache.getOrLoadNs('content:articles', 'a', loader, 60);
    await invalidator.invalidate('articles');
    await cache.getOrLoadNs('content:articles', 'a', loader, 60);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('retires anonymous answers again once other replicas caught up', async () => {
    vi.useFakeTimers();
    const { versions, invalidator } = await setup();

    await invalidator.invalidate('articles');
    const right = await versions.current(PUBLIC_CONTENT_NAMESPACE);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(versions.current(PUBLIC_CONTENT_NAMESPACE)).resolves.not.toBe(
      right
    );
  });

  it('leaves anonymous answers alone for draft changes', async () => {
    const { versions, invalidator } = await setup();
    const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);
    const draftsBefore = await versions.current('content:articles');

    await invalidator.invalidateDraft('articles');

    await expect(versions.current(PUBLIC_CONTENT_NAMESPACE)).resolves.toBe(
      before
    );
    await expect(versions.current('content:articles')).resolves.not.toBe(
      draftsBefore
    );
  });

  it('clears content and answers again at a scheduled publication time', async () => {
    vi.useFakeTimers();
    const { cache, versions, invalidator } = await setup();
    const loader = vi.fn().mockResolvedValue({ id: 'a' });
    const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);

    invalidator.invalidateAt(new Date(Date.now() + 30_000), 'articles');
    await cache.getOrLoadNs('content:articles', 'a', loader, 300);
    await vi.advanceTimersByTimeAsync(33_000);
    await cache.getOrLoadNs('content:articles', 'a', loader, 300);

    expect(loader).toHaveBeenCalledTimes(2);
    await expect(versions.current(PUBLIC_CONTENT_NAMESPACE)).resolves.not.toBe(
      before
    );
  });

  it('does not schedule publication times in the past', async () => {
    vi.useFakeTimers();
    const { invalidator } = await setup();
    const invalidate = vi.spyOn(invalidator, 'invalidate');

    invalidator.invalidateAt(new Date(Date.now() - 1000), 'articles');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('does not schedule publication times more than a day ahead', async () => {
    vi.useFakeTimers();
    const { invalidator } = await setup();
    const invalidate = vi.spyOn(invalidator, 'invalidate');

    invalidator.invalidateAt(
      new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000),
      'articles'
    );
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 60_000);

    expect(invalidate).not.toHaveBeenCalled();
  });

  describe('website pages', () => {
    const withPagesCount = async () => {
      const dragonfly = new FakeDragonfly();
      const replica = await setup(dragonfly);

      return {
        ...replica,
        pagesChanges: () =>
          dragonfly.commands.filter(
            command =>
              command[0] === 'SET' &&
              command[1] === 'nsv:website:pages' &&
              !command.includes('NX')
          ).length,
      };
    };

    it('tells the websites once per publication, after other replicas caught up', async () => {
      vi.useFakeTimers();
      const { invalidator, pagesChanges } = await withPagesCount();

      await invalidator.invalidate('articles');
      await vi.advanceTimersByTimeAsync(3999);

      expect(pagesChanges()).toBe(0);

      await vi.advanceTimersByTimeAsync(66_000);

      expect(pagesChanges()).toBe(1);
    });

    it.each([false, true])(
      'never tells the websites about a reader comment (removed: %s)',
      async removed => {
        vi.useFakeTimers();
        const { invalidator, pagesChanges } = await withPagesCount();

        await invalidator.invalidateReaderComments(removed);
        await vi.advanceTimersByTimeAsync(70_000);

        expect(pagesChanges()).toBe(0);
      }
    );

    it('still retires article answers when a reader comment disappears, since comment blocks show it', async () => {
      vi.useFakeTimers();
      const { versions, invalidator } = await withPagesCount();
      const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);

      await invalidator.invalidateReaderComments(true);

      await expect(
        versions.current(PUBLIC_CONTENT_NAMESPACE)
      ).resolves.not.toBe(before);
    });

    it('retires anonymous answers and the article pages for a changed article without rebuilding other pages', async () => {
      vi.useFakeTimers();
      const { versions, paths, invalidator, pagesChanges } =
        await withPagesCount();
      const changed = vi.spyOn(paths, 'changed');
      const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);

      await invalidator.invalidateArticleAnswers({ id: '1', slug: 'one' });
      await vi.advanceTimersByTimeAsync(70_000);

      await expect(
        versions.current(PUBLIC_CONTENT_NAMESPACE)
      ).resolves.not.toBe(before);
      expect(changed).toHaveBeenCalledWith(['/a/one', '/a/id/1']);
      expect(pagesChanges()).toBe(0);
    });

    it('rebuilds every article page when the layout of all articles changed', async () => {
      const dragonfly = new FakeDragonfly();
      const { invalidator } = await setup(dragonfly);

      await invalidator.invalidateArticleLayout();

      expect(
        dragonfly.commands.filter(
          command =>
            command[0] === 'SET' &&
            command[1] === 'nsv:website:layout' &&
            !command.includes('NX')
        )
      ).toHaveLength(1);
    });

    it('tells the websites when a moderator removes a comment', async () => {
      vi.useFakeTimers();
      const { invalidator, pagesChanges } = await withPagesCount();

      await invalidator.invalidateComments(true);
      await vi.advanceTimersByTimeAsync(70_000);

      expect(pagesChanges()).toBe(1);
    });
  });

  describe('article pages', () => {
    const withPaths = async () => {
      const replica = await setup();

      return { ...replica, changed: vi.spyOn(replica.paths, 'changed') };
    };

    it('tells the websites which article pages changed, old slug included', async () => {
      const { invalidator, changed } = await withPaths();

      await invalidator.invalidateArticlePages(
        { id: '1', slug: 'one' },
        { id: '1', slug: 'renamed' }
      );

      expect(changed).toHaveBeenCalledWith(['/a/one', '/a/id/1', '/a/renamed']);
    });

    it('only names the id path of an article without slug', async () => {
      const { invalidator, changed } = await withPaths();

      await invalidator.invalidateArticlePages({ id: '1', slug: null });

      expect(changed).toHaveBeenCalledWith(['/a/id/1']);
    });

    it('tells the websites the commented article changed when a moderator removes a comment', async () => {
      const { invalidator, changed } = await withPaths();

      await invalidator.invalidateComments(true, { id: '1', slug: 'one' });

      expect(changed).toHaveBeenCalledWith(['/a/one', '/a/id/1']);
    });

    it('tells the websites the commented article changed when a comment gets approved, retiring no other answers', async () => {
      const { versions, invalidator, changed } = await withPaths();
      const content = await versions.current(PUBLIC_CONTENT_NAMESPACE);

      await invalidator.invalidateComments(false, { id: '1', slug: 'one' });

      expect(changed).toHaveBeenCalledWith(['/a/one', '/a/id/1']);
      await expect(versions.current(PUBLIC_CONTENT_NAMESPACE)).resolves.toBe(
        content
      );
    });

    it('names no article page when an approved comment is not on an article', async () => {
      const { invalidator, changed } = await withPaths();

      await invalidator.invalidateComments(false);

      expect(changed).not.toHaveBeenCalled();
    });
  });

  it('clears cached navigations', async () => {
    const { versions, invalidator } = await setup();
    const before = await versions.current('navigations');

    await invalidator.invalidateNavigations();

    await expect(versions.current('navigations')).resolves.not.toBe(before);
  });

  it.each([
    [false, 'keeps'],
    [true, 'retires'],
  ])(
    'with removed=%s it %s article and page answers when comments change',
    async (removed, _) => {
      const { versions, invalidator } = await setup();
      const before = await versions.current(PUBLIC_CONTENT_NAMESPACE);

      await invalidator.invalidateComments(removed);

      const after = await versions.current(PUBLIC_CONTENT_NAMESPACE);
      expect(after !== before).toBe(removed);
    }
  );
});
