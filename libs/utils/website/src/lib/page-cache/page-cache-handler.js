const { readFileSync } = require('fs');
const { join, resolve } = require('path');
const { createPageCache } = require('./page-cache');
const { createSharedStore } = require('./shared-store');
const { tracePageCacheGet } = require('./page-cache-tracing');

const startSpan = (() => {
  try {
    return require('@sentry/nextjs').startSpan;
  } catch {
    return undefined;
  }
})();

const clock = {
  now: () => Date.now(),
  perfNow: () => performance.timeOrigin + performance.now(),
};

const caches = new Map();

const readBuildId = serverDistDir => {
  try {
    return readFileSync(join(serverDistDir, '..', 'BUILD_ID'), 'utf8').trim();
  } catch {
    return undefined;
  }
};

const cacheFor = serverDistDir => {
  const key = serverDistDir ? resolve(serverDistDir) : '';

  if (!caches.has(key)) {
    const buildId = serverDistDir ? readBuildId(serverDistDir) : undefined;
    const shared =
      buildId ? createSharedStore({ env: process.env, buildId }) : undefined;

    caches.set(key, createPageCache({ shared, clock }));
  }

  return caches.get(key);
};

class PageCacheHandler {
  constructor(ctx) {
    this.cache = cacheFor(ctx?.serverDistDir);
    this.request = { prefetch: ctx?._requestHeaders?.purpose === 'prefetch' };
  }

  get(key, ctx) {
    return tracePageCacheGet(startSpan, key, ctx, () =>
      this.cache.get(key, ctx, this.request)
    );
  }

  set(key, data, ctx) {
    return this.cache.set(key, data, ctx);
  }

  async revalidateTag() {
    return;
  }

  resetRequestCache() {
    return;
  }
}

module.exports = PageCacheHandler;
