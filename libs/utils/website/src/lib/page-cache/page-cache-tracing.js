const { pagePath } = require('./page-path');

const tracePageCacheGet = (startSpan, key, ctx, lookup) => {
  if (!startSpan || ctx?.kind !== 'PAGES') {
    return lookup();
  }

  return startSpan(
    {
      name: 'website:pages',
      op: 'cache.get',
      onlyIfParent: true,
      attributes: { 'cache.key': [pagePath(key)] },
    },
    async span => {
      const entry = await lookup();

      span.setAttribute('cache.hit', entry !== null && entry !== undefined);

      return entry;
    }
  );
};

module.exports = { tracePageCacheGet };
