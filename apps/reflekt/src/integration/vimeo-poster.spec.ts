import { vimeoPosterResponse } from './vimeo-poster';

const fetchMock = vi.fn();

const oembed = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('vimeoPosterResponse', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('rejects an id that is not numeric without asking vimeo', async () => {
    expect((await vimeoPosterResponse('abc')).status).toBe(400);
    expect((await vimeoPosterResponse('')).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to the poster vimeo reports, cached for a day', async () => {
    fetchMock.mockResolvedValue(
      oembed({ thumbnail_url: 'https://i.vimeocdn.com/video/1.jpg' })
    );

    const response = await vimeoPosterResponse('1231997573');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://vimeo.com/api/oembed.json?width=1920&url=https%3A%2F%2Fvimeo.com%2F1231997573'
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://i.vimeocdn.com/video/1.jpg'
    );
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );
    expect(response.headers.get('cdn-cache-control')).toBe(
      'public, s-maxage=86400'
    );
  });

  it('answers 404 when vimeo has no https poster', async () => {
    fetchMock.mockResolvedValueOnce(oembed({}, 404));
    expect((await vimeoPosterResponse('1')).status).toBe(404);

    fetchMock.mockResolvedValueOnce(
      oembed({ thumbnail_url: 'http://insecure.example/1.jpg' })
    );
    expect((await vimeoPosterResponse('1')).status).toBe(404);
  });

  it('answers 502 when vimeo is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('down'));

    expect((await vimeoPosterResponse('1')).status).toBe(502);
  });
});
