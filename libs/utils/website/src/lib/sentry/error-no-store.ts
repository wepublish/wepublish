import { ServerResponse } from 'http';

const NO_STORE = 'private, no-store, max-age=0';
const WRAPPED = Symbol.for('wepublish.forbidCachingErrors');

type WriteHead = ((
  this: ServerResponse,
  statusCode: number,
  ...rest: unknown[]
) => ServerResponse) & { [WRAPPED]?: true };

const isCacheControl = (name: unknown) =>
  typeof name === 'string' && name.toLowerCase() === 'cache-control';

const withoutCacheControl = (headers: unknown) => {
  if (Array.isArray(headers)) {
    if (Array.isArray(headers[0])) {
      return headers.filter(([name]) => !isCacheControl(name));
    }

    const kept: unknown[] = [];

    for (let i = 0; i < headers.length; i += 2) {
      if (!isCacheControl(headers[i])) {
        kept.push(headers[i], headers[i + 1]);
      }
    }

    return kept;
  }

  if (headers && typeof headers === 'object') {
    return Object.fromEntries(
      Object.entries(headers).filter(([name]) => !isCacheControl(name))
    );
  }

  return headers;
};

export function forbidCachingErrors() {
  const original = ServerResponse.prototype.writeHead as unknown as WriteHead;

  if (original[WRAPPED]) {
    return;
  }

  const writeHead: WriteHead = function (statusCode, ...rest) {
    if (statusCode === 404 || statusCode >= 500) {
      this.setHeader('cache-control', NO_STORE);

      const last = rest.length - 1;

      if (last >= 0 && typeof rest[last] !== 'string') {
        rest[last] = withoutCacheControl(rest[last]);
      }
    }

    return original.call(this, statusCode, ...rest);
  };

  writeHead[WRAPPED] = true;
  ServerResponse.prototype.writeHead =
    writeHead as unknown as ServerResponse['writeHead'];
}
