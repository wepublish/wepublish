import { ApolloServer, HeaderMap } from '@apollo/server';
import { createCache } from 'cache-manager';
import { GraphqlResponseCachePlugin } from './graphql-response-cache.plugin';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { FakeDragonfly } from './kv-ttl-cache.testing';

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

const createReplica = () =>
  new KvTtlCacheService(createCache(), new FakeDragonfly());

describe('cache spans for Sentry', () => {
  beforeEach(() => {
    spans.length = 0;
  });

  it('marks a lookup that had to load as a miss and the next one as a hit', async () => {
    const kv = createReplica();

    await kv.getOrLoadNs('content:articles', 'id:1', () => ({ id: '1' }), 60);
    await kv.getOrLoadNs('content:articles', 'id:1', () => ({ id: '1' }), 60);

    expect(spans.map(({ options }) => options)).toEqual([
      expect.objectContaining({
        op: 'cache.get',
        name: 'content:articles',
        onlyIfParent: true,
      }),
      expect.objectContaining({ op: 'cache.get', name: 'content:articles' }),
    ]);
    expect(spans.map(({ attributes }) => attributes['cache.hit'])).toEqual([
      false,
      true,
    ]);
  });

  it.each([
    ['a shared namespace', 'content:articles'],
    ['a namespace kept in memory', 'settings:paymentprovider'],
  ])(
    'counts a lookup that waited for another request loading the same key as a miss in %s',
    async (_, namespace) => {
      const kv = createReplica();
      let finishLoad!: () => void;
      const loading = new Promise<void>(resolve => (finishLoad = resolve));
      const loader = async () => {
        await loading;

        return { id: '1' };
      };

      const first = kv.getOrLoadNs(namespace, 'id:1', loader, 60);
      const second = kv.getOrLoadNs(namespace, 'id:1', loader, 60);
      await new Promise(resolve => setTimeout(resolve, 0));
      finishLoad();
      await Promise.all([first, second]);

      expect(spans.map(({ attributes }) => attributes['cache.hit'])).toEqual([
        false,
        false,
      ]);
    }
  );

  it('traces namespaces kept in memory too', async () => {
    const kv = createReplica();

    await kv.getOrLoadNs('settings:paymentprovider', 'stripe', () => 'x', 60);
    await kv.getOrLoadNs('settings:paymentprovider', 'stripe', () => 'x', 60);

    expect(spans.map(({ attributes }) => attributes['cache.hit'])).toEqual([
      false,
      true,
    ]);
  });

  it('names spans after the namespace and never sends a key to Sentry', async () => {
    const kv = createReplica();

    await kv.getOrLoadNs(
      'auth:sessions',
      'user:hash-of-a-session-token',
      () => ({ id: 'session' }),
      60
    );

    expect(spans[0].attributes['cache.key']).toEqual(['auth:sessions']);
    expect(JSON.stringify(spans)).not.toContain('hash-of-a-session-token');
  });

  it('counts a batch as a hit only when every key was cached', async () => {
    const kv = createReplica();
    const load = (missing: string[]) =>
      Promise.resolve(missing.map(id => ({ id })));

    await kv.getOrLoadManyNs('content:images', ['a', 'b'], load, 60, 'id:');
    await kv.getOrLoadManyNs('content:images', ['a', 'c'], load, 60, 'id:');
    await kv.getOrLoadManyNs('content:images', ['a', 'b'], load, 60, 'id:');

    expect(
      spans.map(({ attributes }) => [
        attributes['cache.hit'],
        attributes['cache.keys'],
        attributes['cache.misses'],
      ])
    ).toEqual([
      [false, 2, 2],
      [false, 2, 1],
      [true, 2, 0],
    ]);
  });

  it('traces anonymous GraphQL answers served from the cache', async () => {
    const kv = createReplica();
    let resolved = 0;
    const server = new ApolloServer({
      typeDefs: 'type Query { article(id: ID!): String }',
      resolvers: { Query: { article: () => `article ${++resolved}` } },
      plugins: [new GraphqlResponseCachePlugin(kv)],
    });
    await server.start();
    const query = () =>
      server.executeOperation(
        {
          query: '{ article(id: "1") }',
          http: {
            method: 'POST',
            headers: new HeaderMap(),
            search: '',
            body: {},
          },
        },
        { contextValue: { req: { query: {}, body: {} } } }
      );

    await query();
    await query();
    await server.stop();

    const answers = spans.filter(
      ({ options }) => options['name'] === 'graphql:responses'
    );
    expect(answers.map(({ attributes }) => attributes['cache.hit'])).toEqual([
      false,
      true,
    ]);
    expect(resolved).toBe(1);
  });
});
