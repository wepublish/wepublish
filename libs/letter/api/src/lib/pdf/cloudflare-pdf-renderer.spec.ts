import { PrismaClient, SettingPdfRenderer } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  CloudflarePdfRenderer,
  CloudflarePdfRendererProps,
} from './cloudflare-pdf-renderer';
import { PdfRendererError } from './pdf-renderer';

const PDF = Buffer.from('%PDF-1.4 hello');

function response(
  body: Buffer | string,
  status = 200,
  headers: Record<string, string> = {}
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    // A copy into its own ArrayBuffer: node's Buffer shares a pool, so handing
    // out `.buffer` would return unrelated bytes.
    arrayBuffer: async () =>
      new Uint8Array(typeof body === 'string' ? Buffer.from(body) : body)
        .buffer,
    text: async () => body.toString(),
  } as unknown as Response;
}

const config: SettingPdfRenderer = {
  id: 'cloudflare',
  createdAt: new Date(),
  modifiedAt: new Date(),
  lastLoadedAt: new Date(),
  type: 'cloudflare',
  name: 'Cloudflare',
  cloudflare_accountId: 'account-1',
  cloudflare_apiToken: 'token-1',
  timeoutMs: null,
};

describe('CloudflarePdfRenderer', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function createRenderer(
    setting: SettingPdfRenderer | null = config,
    fallback?: CloudflarePdfRendererProps['fallback']
  ) {
    const renderer = new CloudflarePdfRenderer({
      id: 'cloudflare',
      prisma: {} as PrismaClient,
      kv: {} as KvTtlCacheService,
      fallback,
    });

    jest.spyOn(renderer, 'getConfig').mockResolvedValue(setting);

    return renderer;
  }

  it('posts the html and takes the page size from the css', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    const pdf = await createRenderer().render('<html>sheet</html>');

    expect(pdf).toEqual(PDF);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/account-1/browser-rendering/pdf'
    );
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer token-1');
    expect(JSON.parse(init.body)).toEqual({
      html: '<html>sheet</html>',
      pdfOptions: {
        printBackground: true,
        preferCSSPageSize: true,
      },
    });
  });

  it('falls back to the given credentials when the setting has none', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    await createRenderer(
      { ...config, cloudflare_accountId: null, cloudflare_apiToken: null },
      { accountId: 'env-account', apiToken: 'env-token' }
    ).render('<html></html>');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/env-account/browser-rendering/pdf'
    );
    expect(init.headers.Authorization).toBe('Bearer env-token');
  });

  it('prefers the setting over the fallback credentials', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    await createRenderer(config, {
      accountId: 'env-account',
      apiToken: 'env-token',
    }).render('<html></html>');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/accounts/account-1/');
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  it('uses the configured timeout', async () => {
    fetchMock.mockResolvedValue(response(PDF));
    const timeout = jest.spyOn(AbortSignal, 'timeout');

    await createRenderer({ ...config, timeoutMs: 5000 }).render(
      '<html></html>'
    );

    expect(timeout).toHaveBeenCalledWith(5000);
    timeout.mockRestore();
  });

  it('does not render without credentials, and does not call out', async () => {
    await expect(createRenderer(null).render('<html></html>')).rejects.toThrow(
      PdfRendererError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('names the rate limit and the wait when it is reached', async () => {
    fetchMock.mockResolvedValue(
      response('{"errors":["rate limited"]}', 429, { 'retry-after': '30' })
    );

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /rate limit was reached, retry after 30s/
    );
  });

  it('reports an unreachable renderer rather than a bad pdf', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /Could not reach the pdf renderer/
    );
  });

  /**
   * The endpoint answers a json error with a 200 in some cases. Printing that
   * would post an envelope containing an error message.
   */
  it('refuses a body that is not a pdf', async () => {
    fetchMock.mockResolvedValue(
      response('{"success":false,"errors":["no browser available"]}')
    );

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /did not return a pdf/
    );
  });
});
