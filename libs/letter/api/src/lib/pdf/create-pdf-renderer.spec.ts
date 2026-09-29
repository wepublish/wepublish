import { PdfRendererType } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { CloudflarePdfRenderer } from './cloudflare-pdf-renderer';
import { createPdfRenderer, loadPdfRenderer } from './create-pdf-renderer';

describe('loadPdfRenderer', () => {
  it('builds the renderer of the configured type', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValue({
        id: 'cloudflare',
        type: PdfRendererType.cloudflare,
      });

    const renderer = await loadPdfRenderer({
      prisma: { settingPdfRenderer: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(renderer).toBeInstanceOf(CloudflarePdfRenderer);
    expect(renderer?.id).toBe('cloudflare');
  });

  it('reports no renderer when none is configured', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);

    const renderer = await loadPdfRenderer({
      prisma: { settingPdfRenderer: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(renderer).toBeNull();
  });
});

describe('createPdfRenderer', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('falls back to the cloudflare credentials from the environment', async () => {
    process.env = {
      ...env,
      CLOUDFLARE_ACCOUNT_ID: 'env-account',
      CLOUDFLARE_API_TOKEN: 'env-token',
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array(Buffer.from('%PDF-1.4')).buffer,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const renderer = createPdfRenderer(
      'cloudflare',
      PdfRendererType.cloudflare,
      {
        prisma: {} as never,
        kv: createKvMock(),
      }
    );
    jest.spyOn(renderer, 'getConfig').mockResolvedValue(null);

    await renderer.render('<html></html>');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/accounts/env-account/');
    expect(init.headers.Authorization).toBe('Bearer env-token');
  });
});
