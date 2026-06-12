import { promises as dns } from 'dns';
import { assertRemoteFileIsAccessible } from './assertRemoteFileIsAccessible';

describe('assertRemoteFileIsAccessible', () => {
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('checks reachable HTTP(S) URLs without following redirects', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchMock;

    await expect(
      assertRemoteFileIsAccessible('https://media.example.com/image.jpg')
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://media.example.com/image.jpg',
      {
        method: 'HEAD',
        redirect: 'manual',
        signal: expect.any(AbortSignal),
      }
    );
  });

  it('rejects non-HTTP protocols before fetching', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(
      assertRemoteFileIsAccessible('file:///etc/passwd')
    ).rejects.toThrow('Remote object URL must use HTTP or HTTPS');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects private network hosts in production before fetching', async () => {
    process.env.NODE_ENV = 'production';
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(
      assertRemoteFileIsAccessible('http://127.0.0.1:9000/private.jpg')
    ).rejects.toThrow('Remote object URL host is not allowed');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects hosts that resolve to private network addresses in production before fetching', async () => {
    process.env.NODE_ENV = 'production';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchMock;
    jest.spyOn(dns, 'lookup').mockResolvedValue([
      {
        address: '10.0.0.10',
        family: 4,
      },
    ] as unknown as Awaited<ReturnType<typeof dns.lookup>>);

    await expect(
      assertRemoteFileIsAccessible('https://media.example.com/image.jpg')
    ).rejects.toThrow('Remote object URL host is not allowed');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose the full remote object URL in fetch errors', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    global.fetch = fetchMock;

    await expect(
      assertRemoteFileIsAccessible(
        'https://media.example.com/private/customer-file.jpg?token=secret'
      )
    ).rejects.toThrow('Failed to reach remote object');

    expect(errorSpy).toHaveBeenCalledWith(
      'Fetch error while checking remote object',
      expect.objectContaining({
        origin: 'https://media.example.com',
        message: 'network down',
      })
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      'customer-file.jpg'
    );
  });
});
