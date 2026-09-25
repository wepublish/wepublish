import { CloudflarePdfRenderer, PdfRendererError } from './pdf-renderer';

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

describe('CloudflarePdfRenderer', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function createRenderer() {
    return new CloudflarePdfRenderer({
      accountId: 'account-1',
      apiToken: 'token-1',
    });
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

  it('does not render without credentials, and does not call out', async () => {
    const renderer = new CloudflarePdfRenderer({
      accountId: '',
      apiToken: '',
    });

    await expect(renderer.render('<html></html>')).rejects.toThrow(
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
