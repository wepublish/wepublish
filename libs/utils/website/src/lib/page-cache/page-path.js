const ROUTE_CACHE_KEY = /^\/route-cache\/[^/]+\/[^/]+\/\$(\/.*)$/;

const pagePath = key => {
  const normalized = ROUTE_CACHE_KEY.exec(key)?.[1];

  if (normalized === undefined) {
    return key;
  }

  if (normalized === '/index') {
    return '/';
  }

  return normalized.startsWith('/index/') ? normalized.slice(6) : normalized;
};

module.exports = { pagePath };
