const { readFileSync } = require('fs');

const CONNECTION_TIMEOUT_MS = 1000;
const COMMAND_TIMEOUT_MS = 1000;
const UNAVAILABLE_RETRY_MS = 5000;
const PAGE_TTL_MS = 3 * 60 * 60 * 1000;
const LOCK_TTL_MS = 10_000;
const MAX_SHARED_CHARS = 2 * 1024 * 1024;
const WEBSITE_PAGES_VERSION = 'website:pages';
const API_HEARTBEAT_KEY = 'website:heartbeat';

const describe = error =>
  error instanceof Error ? error.message : String(error);

const timeout = (promise, ms, what) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`no ${what} within ${ms} ms`)),
      ms
    );

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const tlsOptions = (env, url, logger) => {
  const production = env.NODE_ENV === 'production';

  if (production && url.protocol !== 'rediss:') {
    logger.error(
      '[page-cache] REDIS_URL must use rediss:// in production, caching pages on this pod only'
    );

    return undefined;
  }

  if (url.protocol !== 'rediss:') {
    return {};
  }

  if (!env.NODE_EXTRA_CA_CERTS) {
    if (production) {
      logger.error(
        '[page-cache] NODE_EXTRA_CA_CERTS must point to the internal CA to verify Dragonfly in production, caching pages on this pod only'
      );

      return undefined;
    }

    return { tls: true, rejectUnauthorized: true };
  }

  try {
    return {
      tls: true,
      rejectUnauthorized: true,
      ca: readFileSync(env.NODE_EXTRA_CA_CERTS, 'utf8'),
    };
  } catch {
    logger.error(
      `[page-cache] Cannot read the CA to verify Dragonfly from ${env.NODE_EXTRA_CA_CERTS}, caching pages on this pod only`
    );

    return undefined;
  }
};

const restoreFastStringPrototype = () => {
  const probe = Object.setPrototypeOf({}, String.prototype);
  let found = 0;

  for (let i = 0; i < 1000; i++) {
    if (probe.charCodeAt) {
      found++;
    }
  }

  return found;
};

const createRedisClient = options => {
  const client = require('@keyv/redis').createClient(options);
  restoreFastStringPrototype();

  return client;
};

function createSharedStore({
  env,
  buildId,
  createClient = createRedisClient,
  logger = console,
}) {
  if (!env.REDIS_URL || env.NEXT_PHASE === 'phase-production-build') {
    return undefined;
  }

  if (!env.REDIS_KEY_PREFIX) {
    logger.error(
      '[page-cache] REDIS_KEY_PREFIX must be set when REDIS_URL is set, caching pages on this pod only'
    );

    return undefined;
  }

  const tls = tlsOptions(env, new URL(env.REDIS_URL), logger);

  if (!tls) {
    return undefined;
  }

  const prefix = env.REDIS_KEY_PREFIX;
  const options = {
    url: env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: CONNECTION_TIMEOUT_MS,
      reconnectStrategy: false,
      ...tls,
    },
  };

  let client;
  let connecting;
  let unavailableUntil = 0;

  const key = name => `${prefix}::${name}`;
  const pageKey = path => key(`page:${buildId}:${path}`);
  const lockKey = path => key(`page-lock:${buildId}:${path}`);

  const destroy = candidate => {
    try {
      candidate?.destroy();
    } catch {
      return;
    }
  };

  const drop = () => {
    const current = client;
    client = undefined;
    destroy(current);
  };

  const fail = error => {
    drop();
    unavailableUntil = Date.now() + UNAVAILABLE_RETRY_MS;
    logger.error(
      `[page-cache] Dragonfly unavailable, caching pages on this pod only for the next ${
        UNAVAILABLE_RETRY_MS / 1000
      } s: ${describe(error)}`
    );
  };

  const connected = () => {
    if (client?.isReady) {
      return client;
    }

    connecting ??= (async () => {
      drop();

      // Constructing the client has to be inside the try as well: a bundler
      // that hands `require('@keyv/redis')` back as the default export rather
      // than the namespace makes this throw, and the page cache must degrade
      // to this pod only rather than take the request down with it.
      let candidate;

      try {
        candidate = createClient(options);
        candidate.on('error', () => undefined);

        await timeout(candidate.connect(), CONNECTION_TIMEOUT_MS, 'connection');
        client = candidate;

        return candidate;
      } catch (error) {
        destroy(candidate);
        fail(error);

        return undefined;
      }
    })().finally(() => {
      connecting = undefined;
    });

    return connecting;
  };

  const send = async command => {
    if (Date.now() < unavailableUntil) {
      return undefined;
    }

    const ready = await connected();

    if (!ready) {
      return undefined;
    }

    try {
      return (
        (await timeout(
          ready.sendCommand(command),
          COMMAND_TIMEOUT_MS,
          'answer'
        )) ?? null
      );
    } catch (error) {
      fail(error);

      return undefined;
    }
  };

  return {
    async getVersion() {
      const versions = await this.getVersions([WEBSITE_PAGES_VERSION]);

      return versions?.[0];
    },

    async getVersions(names) {
      const reply = await send([
        'MGET',
        key(API_HEARTBEAT_KEY),
        ...names.map(name => key(`nsv:${name}`)),
      ]);

      if (!Array.isArray(reply) || typeof reply[0] !== 'string') {
        return undefined;
      }

      return reply
        .slice(1)
        .map(version => (typeof version === 'string' ? version : null));
    },

    async getEntry(path) {
      const reply = await send(['GET', pageKey(path)]);

      if (typeof reply !== 'string') {
        return reply === null ? null : undefined;
      }

      try {
        return JSON.parse(reply);
      } catch {
        return null;
      }
    },

    async setEntry(path, entry) {
      const text = JSON.stringify(entry);

      if (text.length > MAX_SHARED_CHARS) {
        await send(['DEL', pageKey(path)]);

        return false;
      }

      return (
        (await send([
          'SET',
          pageKey(path),
          text,
          'PX',
          String(PAGE_TTL_MS),
        ])) === 'OK'
      );
    },

    async deleteEntry(path) {
      await send(['DEL', pageKey(path)]);
    },

    async acquireLock(path) {
      const reply = await send([
        'SET',
        lockKey(path),
        String(Date.now()),
        'NX',
        'PX',
        String(LOCK_TTL_MS),
      ]);

      return reply !== null;
    },

    async lockedSince(path) {
      const reply = await send(['GET', lockKey(path)]);
      const since = Number(reply);

      return typeof reply === 'string' && Number.isFinite(since) ?
          since
        : undefined;
    },

    async releaseLock(path) {
      await send(['DEL', lockKey(path)]);
    },
  };
}

module.exports = { createSharedStore };
