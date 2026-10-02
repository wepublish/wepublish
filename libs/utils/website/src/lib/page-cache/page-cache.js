const VERSION_REFRESH_MS = 2000;
const DEFAULT_REVALIDATE_SECONDS = 60;
const UNSIGNALLED_REVALIDATE_SECONDS = 60;
const DEFAULT_MAX_LOCAL_BYTES = 50 * 1024 * 1024;
const MAX_PENDING = 10000;
const STALE = 1;
const SHARED_KINDS = new Set(['PAGES', 'REDIRECT']);
const LAYOUT_VERSION = 'website:layout';
const ARTICLE_PAGE = /^\/a\/(?:id\/[^/]+|(?!tag$|index$)[^/]+)$/;

const isArticlePage = key => ARTICLE_PAGE.test(key);

const sizeOf = value => {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const isNotFound = value =>
  value === null || (value?.kind === 'PAGES' && value.status === 404);

function createPageCache({
  shared,
  clock,
  maxLocalBytes = DEFAULT_MAX_LOCAL_BYTES,
}) {
  const local = new Map();
  const pending = new Map();
  const knownVersions = new Map();
  const versionsInFlight = new Map();
  let localBytes = 0;
  let known;
  let versionInFlight;
  let signalled = false;

  const forget = key => {
    const item = local.get(key);

    if (item) {
      localBytes -= item.size;
      local.delete(key);
    }
  };

  const keep = (key, entry) => {
    forget(key);

    const size = sizeOf(entry);

    if (size > maxLocalBytes) {
      return;
    }

    local.set(key, { entry, size });
    localBytes += size;

    while (localBytes > maxLocalBytes) {
      forget(local.keys().next().value);
    }
  };

  const read = key => {
    const item = local.get(key);

    if (!item) {
      return undefined;
    }

    local.delete(key);
    local.set(key, item);

    return item.entry;
  };

  const remember = (key, version) => {
    pending.delete(key);
    pending.set(key, version);

    if (pending.size > MAX_PENDING) {
      pending.delete(pending.keys().next().value);
    }
  };

  const currentVersion = async () => {
    if (!shared) {
      return undefined;
    }

    if (known && clock.now() - known.checkedAt < VERSION_REFRESH_MS) {
      return known.version;
    }

    versionInFlight ??= (async () => {
      const version = await shared.getVersion();
      signalled = version !== undefined;

      if (version !== undefined) {
        known = { version, checkedAt: clock.now() };
      }

      return version === undefined ? known?.version : version;
    })().finally(() => {
      versionInFlight = undefined;
    });

    return versionInFlight;
  };

  const knowVersion = (name, version) => {
    knownVersions.delete(name);
    knownVersions.set(name, { version, checkedAt: clock.now() });

    if (knownVersions.size > MAX_PENDING) {
      knownVersions.delete(knownVersions.keys().next().value);
    }
  };

  const articleVersion = async key => {
    if (!shared) {
      return undefined;
    }

    const names = [LAYOUT_VERSION, `website:path:${key.toLowerCase()}`];
    const recent = names.map(name => knownVersions.get(name));

    if (
      recent.every(
        item => item && clock.now() - item.checkedAt < VERSION_REFRESH_MS
      )
    ) {
      return JSON.stringify(recent.map(item => item.version));
    }

    if (!versionsInFlight.has(key)) {
      versionsInFlight.set(
        key,
        (async () => {
          const versions = await shared.getVersions(names);
          signalled = versions !== undefined;

          if (versions) {
            names.forEach((name, index) => knowVersion(name, versions[index]));
          }

          const resolved =
            versions ?? names.map(name => knownVersions.get(name)?.version);

          return resolved.some(version => version === undefined) ? undefined : (
              JSON.stringify(resolved)
            );
        })().finally(() => {
          versionsInFlight.delete(key);
        })
      );
    }

    return versionsInFlight.get(key);
  };

  const versionFor = key =>
    isArticlePage(key) ? articleVersion(key) : currentVersion();

  const isCurrent = (entry, version) =>
    version === undefined || entry.version === version;

  const isExpired = entry => {
    const seconds = entry.revalidate ?? DEFAULT_REVALIDATE_SECONDS;

    if (typeof seconds !== 'number') {
      return false;
    }

    const limit =
      signalled ? seconds : Math.min(seconds, UNSIGNALLED_REVALIDATE_SECONDS);

    return clock.now() - entry.lastModified > limit * 1000;
  };

  const isFresh = (entry, version) =>
    isCurrent(entry, version) && !isExpired(entry);

  const fresh = entry => ({
    value: entry.value,
    lastModified: clock.perfNow(),
  });

  const stale = entry => ({ value: entry.value, lastModified: STALE });

  const newest = (mine, theirs) => {
    if (!theirs) {
      return mine;
    }

    if (!mine) {
      return theirs;
    }

    return theirs.lastModified > mine.lastModified ? theirs : mine;
  };

  return {
    async get(key, ctx) {
      if (ctx?.kind !== 'PAGES') {
        const entry = read(key);

        return entry ?
            { value: entry.value, lastModified: entry.lastModified }
          : null;
      }

      const version = await versionFor(key);
      const mine = read(key);

      if (mine && isFresh(mine, version)) {
        return fresh(mine);
      }

      const theirs = shared ? await shared.getEntry(key) : undefined;

      if (theirs === null && mine) {
        forget(key);
        remember(key, version);

        return null;
      }

      const best = newest(mine, theirs);

      if (!best) {
        remember(key, version);

        return null;
      }

      if (best === theirs) {
        keep(key, theirs);
      }

      if (isFresh(best, version)) {
        return fresh(best);
      }

      if (!shared || (await shared.acquireLock(key))) {
        remember(key, version);

        return stale(best);
      }

      return fresh(best);
    },

    async set(key, value, ctx) {
      if (value && !SHARED_KINDS.has(value.kind)) {
        keep(key, { value, lastModified: clock.now() });

        return;
      }

      const version =
        pending.has(key) ? pending.get(key) : await versionFor(key);
      pending.delete(key);

      if (isNotFound(value)) {
        forget(key);

        if (shared) {
          await shared.deleteEntry(key);
          await shared.releaseLock(key);
        }

        return;
      }

      const entry = {
        value,
        lastModified: clock.now(),
        revalidate: ctx?.cacheControl?.revalidate,
        version,
      };

      keep(key, entry);

      if (shared) {
        await shared.setEntry(key, entry);
        await shared.releaseLock(key);
      }
    },
  };
}

module.exports = { createPageCache };
