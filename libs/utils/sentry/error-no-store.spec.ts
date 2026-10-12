import { createServer, ServerResponse, type RequestListener } from 'http';
import { AddressInfo } from 'net';
import { forbidCachingErrors } from './error-no-store';

const NO_STORE = 'private, no-store, max-age=0';

const respond = async (handler: RequestListener) => {
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, resolve));

  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://localhost:${port}/`);
    await response.text();

    return response;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
};

describe('forbidCachingErrors', () => {
  const original = ServerResponse.prototype.writeHead;

  beforeAll(() => {
    forbidCachingErrors();
  });

  afterAll(() => {
    ServerResponse.prototype.writeHead = original;
  });

  it('replaces a shared cache header on a 404', async () => {
    const response = await respond((_req, res) => {
      res.setHeader(
        'cache-control',
        'public, max-age=59, s-maxage=59, stale-if-error=86400'
      );
      res.statusCode = 404;
      res.end('not found');
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe(NO_STORE);
  });

  it('replaces a cache header passed to writeHead as an object', async () => {
    const response = await respond((_req, res) => {
      res.writeHead(404, { 'Cache-Control': 's-maxage=1' });
      res.end();
    });

    expect(response.headers.get('cache-control')).toBe(NO_STORE);
  });

  it('replaces a cache header passed to writeHead as a raw array', async () => {
    const response = await respond((_req, res) => {
      res.writeHead(404, 'Not Found', ['Cache-Control', 's-maxage=1']);
      res.end();
    });

    expect(response.headers.get('cache-control')).toBe(NO_STORE);
  });

  it('adds the header to a 404 that had none', async () => {
    const response = await respond((_req, res) => {
      res.writeHead(404);
      res.end();
    });

    expect(response.headers.get('cache-control')).toBe(NO_STORE);
  });

  it.each([500, 502, 503])(
    'replaces a shared cache header on a %s, so the CDN never keeps an error page',
    async status => {
      const response = await respond((_req, res) => {
        res.setHeader(
          'cache-control',
          'public, max-age=59, s-maxage=59, stale-if-error=86400'
        );
        res.statusCode = status;
        res.end('error');
      });

      expect(response.status).toBe(status);
      expect(response.headers.get('cache-control')).toBe(NO_STORE);
    }
  );

  it.each([301, 307, 410])('leaves a %s alone', async status => {
    const response = await respond((_req, res) => {
      res.setHeader('cache-control', 'public, max-age=59, s-maxage=59');
      res.writeHead(status);
      res.end();
    });

    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=59, s-maxage=59'
    );
  });

  it('leaves other responses alone', async () => {
    const response = await respond((_req, res) => {
      res.setHeader('cache-control', 'public, max-age=59, s-maxage=59');
      res.end('ok');
    });

    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=59, s-maxage=59'
    );
  });

  it('keeps the other headers of a 404', async () => {
    const response = await respond((_req, res) => {
      res.setHeader('x-nextjs-cache', 'MISS');
      res.writeHead(404, { 'content-type': 'text/html' });
      res.end();
    });

    expect(response.headers.get('x-nextjs-cache')).toBe('MISS');
    expect(response.headers.get('content-type')).toBe('text/html');
  });

  it('wraps writeHead only once when called again', () => {
    const wrapped = ServerResponse.prototype.writeHead;

    forbidCachingErrors();

    expect(ServerResponse.prototype.writeHead).toBe(wrapped);
  });
});
