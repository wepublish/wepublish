// @vitest-environment node
import { createLlmsTxtFetchHandler } from './fetch-handlers';
import { SitemapClient } from '../sitemap';

const emptyClient = () =>
  ({
    query: vi.fn(async () => ({
      data: { articles: { nodes: [] }, pages: { nodes: [] } },
    })),
  }) as unknown as SitemapClient;

const failingClient = () =>
  ({
    query: vi.fn(async () => {
      throw new Error('API down');
    }),
  }) as unknown as SitemapClient;

const request = (headers: Record<string, string> = { host: 'example.com' }) =>
  new Request('http://internal:3000/llms.txt', { headers });

describe('llms.txt fetch handler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves markdown the CDN may keep', async () => {
    const response = await createLlmsTxtFetchHandler(
      { title: 'Example' },
      { getClient: emptyClient }
    )(request());
    const policy = response.headers.get('cache-control');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/markdown; charset=utf-8'
    );
    expect(policy).toContain('s-maxage=');
    expect(response.headers.get('cdn-cache-control')).toBe(policy);
    expect(response.headers.get('vercel-cdn-cache-control')).toBe(policy);
    expect(await response.text()).toContain('# Example');
  });

  it('links the public host the proxy forwarded, not the pod', async () => {
    vi.stubEnv('WEBSITE_URL', '');
    const response = await createLlmsTxtFetchHandler(
      { title: 'Example' },
      { getClient: emptyClient }
    )(
      request({
        host: 'internal:3000',
        'x-forwarded-host': 'example.com',
        'x-forwarded-proto': 'https',
      })
    );

    expect(await response.text()).toContain('(https://example.com)');
  });

  it('answers a failing API with an uncached 500', async () => {
    const response = await createLlmsTxtFetchHandler(
      { title: 'Example' },
      { getClient: failingClient }
    )(request());

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
