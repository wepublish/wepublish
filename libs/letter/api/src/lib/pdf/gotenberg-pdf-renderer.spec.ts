import { PrismaClient, SettingPdfRenderer } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  GotenbergPdfRenderer,
  GotenbergPdfRendererProps,
} from './gotenberg-pdf-renderer';
import { PdfRendererError } from './pdf-renderer';

const PDF = Buffer.from('%PDF-1.4 hello');

function response(body: Buffer | string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    // A copy into its own ArrayBuffer: node's Buffer shares a pool, so handing
    // out `.buffer` would return unrelated bytes.
    arrayBuffer: async () =>
      new Uint8Array(typeof body === 'string' ? Buffer.from(body) : body)
        .buffer,
    text: async () => body.toString(),
  } as unknown as Response;
}

const config: SettingPdfRenderer = {
  id: 'gotenberg',
  createdAt: new Date(),
  modifiedAt: new Date(),
  lastLoadedAt: new Date(),
  type: 'gotenberg',
  name: 'Gotenberg',
  cloudflare_accountId: null,
  cloudflare_apiToken: null,
  gotenberg_url: 'http://gotenberg:3000/',
  gotenberg_username: null,
  gotenberg_password: null,
  timeoutMs: null,
};

describe('GotenbergPdfRenderer', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function createRenderer(
    setting: SettingPdfRenderer | null = config,
    fallback?: GotenbergPdfRendererProps['fallback']
  ) {
    const renderer = new GotenbergPdfRenderer({
      id: 'gotenberg',
      prisma: {} as PrismaClient,
      kv: {} as KvTtlCacheService,
      fallback,
    });

    jest.spyOn(renderer, 'getConfig').mockResolvedValue(setting);

    return renderer;
  }

  it('posts the html as index.html and takes the page size from the css', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    const pdf = await createRenderer().render('<html>sheet</html>');

    expect(pdf).toEqual(PDF);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://gotenberg:3000/forms/chromium/convert/html');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBeUndefined();

    const form = init.body as FormData;
    const file = form.get('files') as File;
    expect(file.name).toBe('index.html');
    expect(await file.text()).toBe('<html>sheet</html>');
    expect(form.get('printBackground')).toBe('true');
    expect(form.get('preferCssPageSize')).toBe('true');
  });

  it('authenticates with basic auth when credentials are configured', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    await createRenderer({
      ...config,
      gotenberg_username: 'user',
      gotenberg_password: 'pass',
    }).render('<html></html>');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from('user:pass').toString('base64')}`
    );
  });

  it('falls back to the given url and credentials when the setting has none', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    await createRenderer(null, {
      url: 'http://fallback:3000',
      username: 'env-user',
      password: 'env-pass',
    }).render('<html></html>');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://fallback:3000/forms/chromium/convert/html');
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from('env-user:env-pass').toString('base64')}`
    );
  });

  it('prefers the setting over the fallback url', async () => {
    fetchMock.mockResolvedValue(response(PDF));

    await createRenderer(config, { url: 'http://fallback:3000' }).render(
      '<html></html>'
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://gotenberg:3000/forms/chromium/convert/html'
    );
  });

  it('uses the configured timeout', async () => {
    fetchMock.mockResolvedValue(response(PDF));
    const timeout = jest.spyOn(AbortSignal, 'timeout');

    await createRenderer({ ...config, timeoutMs: 5000 }).render(
      '<html></html>'
    );

    expect(timeout).toHaveBeenCalledWith(5000);
  });

  it('does not render without a url, and does not call out', async () => {
    await expect(
      createRenderer({ ...config, gotenberg_url: null }).render('<html></html>')
    ).rejects.toThrow(PdfRendererError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a refused request with its status and reason', async () => {
    fetchMock.mockResolvedValue(response('Service Unavailable', 503));

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /status 503.*Service Unavailable/
    );
  });

  it('reports an unreachable renderer rather than a bad pdf', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /Could not reach the pdf renderer: ECONNREFUSED/
    );
  });

  it('refuses a body that is not a pdf', async () => {
    fetchMock.mockResolvedValue(response('{"error":"nope"}'));

    await expect(createRenderer().render('<html></html>')).rejects.toThrow(
      /did not return a pdf/
    );
  });
});
