// @vitest-environment node
import { createStartPageCache } from './page-cache';

const ISR_60 =
  'public, max-age=59, s-maxage=60, stale-while-revalidate=604800, stale-if-error=86400';

class FakeClock {
  time = 1_800_000_000_000;

  now = () => this.time;
  perfNow = () => this.time + 0.25;

  advance(ms: number) {
    this.time += ms;
  }
}

/**
 * The adapter renders in the background on a stale hit. Tests hand it a
 * `waitUntil` that collects those promises so they can be awaited instead of
 * raced.
 */
const collector = () => {
  const pending: Promise<unknown>[] = [];

  return {
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
    settled: () => Promise.all(pending.splice(0)),
  };
};

const document = (url: string, init: RequestInit = {}) =>
  new Request(url, { headers: { accept: 'text/html' }, ...init });

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8', ...init.headers },
    status: init.status ?? 200,
  });

const setup = (
  render: (request: Request) => Response | Promise<Response>,
  clock = new FakeClock()
) => {
  const { waitUntil, settled } = collector();
  const calls: string[] = [];
  const withPageCache = createStartPageCache({
    env: {},
    buildId: 'build-test',
    clock,
    waitUntil,
  });

  const fetch = withPageCache(request => {
    calls.push(new URL(request.url).pathname);

    return render(request);
  });

  return { fetch, calls, clock, settled };
};

describe('createStartPageCache', () => {
  it('renders a document once and serves the stored copy afterwards', async () => {
    const { fetch, calls, settled } = setup(() =>
      html('<p>one</p>', { headers: { 'cache-control': ISR_60 } })
    );

    const first = await fetch(document('https://site.test/a/one'));
    await settled();
    const second = await fetch(document('https://site.test/a/one'));

    expect(await first.text()).toBe('<p>one</p>');
    expect(await second.text()).toBe('<p>one</p>');
    expect(second.headers.get('x-page-cache')).toBe('HIT');
    expect(calls).toEqual(['/a/one']);
  });

  it('serves the stale copy and re-renders in the background once the window passes', async () => {
    let body = 'one';
    const clock = new FakeClock();
    const { fetch, calls, settled } = setup(
      () => html(`<p>${body}</p>`, { headers: { 'cache-control': ISR_60 } }),
      clock
    );

    await fetch(document('https://site.test/a/one'));
    await settled();
    clock.advance(61_000);
    body = 'two';

    const stale = await fetch(document('https://site.test/a/one'));
    await settled();
    const regenerated = await fetch(document('https://site.test/a/one'));

    expect(await stale.text()).toBe('<p>one</p>');
    expect(stale.headers.get('x-page-cache')).toBe('STALE');
    expect(await regenerated.text()).toBe('<p>two</p>');
    expect(regenerated.headers.get('x-page-cache')).toBe('HIT');
    expect(calls).toEqual(['/a/one', '/a/one']);
  });

  it('never stores a response the cache headers forbid storing', async () => {
    const { fetch, calls, settled } = setup(() =>
      html('<p>private</p>', { headers: { 'cache-control': 'no-store' } })
    );

    await fetch(document('https://site.test/profile'));
    await settled();
    await fetch(document('https://site.test/profile'));

    expect(calls).toEqual(['/profile', '/profile']);
  });

  it('never stores a response that sets a cookie', async () => {
    const { fetch, calls, settled } = setup(() =>
      html('<p>session</p>', {
        headers: { 'cache-control': ISR_60, 'set-cookie': 'token=abc' },
      })
    );

    await fetch(document('https://site.test/'));
    await settled();
    await fetch(document('https://site.test/'));

    expect(calls).toEqual(['/', '/']);
  });

  it('leaves everything that is not a document request alone', async () => {
    const { fetch, calls, settled } = setup(() =>
      html('<p>one</p>', { headers: { 'cache-control': ISR_60 } })
    );

    await fetch(document('https://site.test/a/one', { method: 'POST' }));
    await fetch(document('https://site.test/_serverFn/getUser'));
    await fetch(document('https://site.test/rss.xml'));
    await fetch(new Request('https://site.test/a/one'));
    await settled();
    await fetch(document('https://site.test/a/one'));

    expect(calls).toEqual([
      '/a/one',
      '/_serverFn/getUser',
      '/rss.xml',
      '/a/one',
      '/a/one',
    ]);
  });

  it('drops a stored page once revalidation finds it unpublished', async () => {
    let status = 200;
    const clock = new FakeClock();
    const { fetch, calls, settled } = setup(
      () =>
        status === 200 ?
          html('<p>one</p>', { headers: { 'cache-control': ISR_60 } })
        : html('<p>gone</p>', {
            status: 404,
            headers: { 'cache-control': 'no-store' },
          }),
      clock
    );

    await fetch(document('https://site.test/a/one'));
    await settled();
    clock.advance(61_000);
    status = 404;

    // The stale copy is still served while the revalidation discovers the 404.
    const stale = await fetch(document('https://site.test/a/one'));
    await settled();
    const afterwards = await fetch(document('https://site.test/a/one'));

    expect(stale.status).toBe(200);
    expect(afterwards.status).toBe(404);
    expect(calls).toEqual(['/a/one', '/a/one', '/a/one']);
  });

  it('replays the status and the stored headers but not the transfer headers', async () => {
    const { fetch, settled } = setup(() =>
      html('<p>one</p>', {
        status: 200,
        headers: {
          'cache-control': ISR_60,
          'content-length': '10',
          link: '</_build/app.js>; rel=preload',
        },
      })
    );

    await fetch(document('https://site.test/a/one'));
    await settled();
    const replayed = await fetch(document('https://site.test/a/one'));

    expect(replayed.status).toBe(200);
    expect(replayed.headers.get('content-type')).toBe(
      'text/html; charset=utf-8'
    );
    expect(replayed.headers.get('cache-control')).toBe(ISR_60);
    expect(replayed.headers.get('link')).toBe('</_build/app.js>; rel=preload');
    expect(replayed.headers.get('content-length')).toBeNull();
  });

  it('keeps the query string out of the article path but inside the cache key', async () => {
    const { fetch, calls, settled } = setup(() =>
      html('<p>page</p>', { headers: { 'cache-control': ISR_60 } })
    );

    await fetch(document('https://site.test/a?page=1'));
    await fetch(document('https://site.test/a?page=2'));
    await settled();
    await fetch(document('https://site.test/a?page=1'));

    expect(calls).toEqual(['/a', '/a']);
  });

  it('lets a failing render through without storing anything', async () => {
    let fail = true;
    const { fetch, calls, settled } = setup(() => {
      if (fail) {
        throw new Error('api down');
      }

      return html('<p>one</p>', { headers: { 'cache-control': ISR_60 } });
    });

    await expect(fetch(document('https://site.test/a/one'))).rejects.toThrow(
      'api down'
    );
    fail = false;
    await fetch(document('https://site.test/a/one'));
    await settled();

    expect(calls).toEqual(['/a/one', '/a/one']);
  });
});
