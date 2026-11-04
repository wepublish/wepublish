const STALE_CHUNK_MESSAGES = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
  'Unable to preload CSS',
];

const STORAGE_KEY = 'wepublish:stale-chunk-reload';
const RELOAD_COOLDOWN_MS = 30_000;

type ReloadStorage = Pick<Storage, 'getItem' | 'setItem'>;

type StaleChunkReloaderOptions = {
  storage: () => ReloadStorage | undefined;
  reload: () => void;
  now: () => number;
};

export const isStaleChunkError = (error: unknown) =>
  error instanceof Error &&
  STALE_CHUNK_MESSAGES.some(message => error.message.includes(message));

const lastReloadAt = (storage: () => ReloadStorage | undefined) => {
  try {
    return Number(storage()?.getItem(STORAGE_KEY) ?? 0);
  } catch {
    return 0;
  }
};

const rememberReload = (
  storage: () => ReloadStorage | undefined,
  at: number
) => {
  try {
    storage()?.setItem(STORAGE_KEY, String(at));
  } catch {
    return;
  }
};

export const createStaleChunkReloader = ({
  storage,
  reload,
  now,
}: {
  storage: ReloadStorage | undefined;
  reload: () => void;
  now: () => number;
}) => createReloader({ storage: () => storage, reload, now });

const createReloader = ({
  storage,
  reload,
  now,
}: StaleChunkReloaderOptions) => {
  let reloading = false;

  return (error: unknown) => {
    if (!isStaleChunkError(error)) {
      return false;
    }

    if (reloading) {
      return true;
    }

    if (now() - lastReloadAt(storage) < RELOAD_COOLDOWN_MS) {
      return false;
    }

    reloading = true;
    rememberReload(storage, now());
    reload();

    return true;
  };
};

export const reloadForStaleChunk = createReloader({
  storage: () =>
    typeof window === 'undefined' ? undefined : window.sessionStorage,
  reload: () => window.location.reload(),
  now: () => Date.now(),
});

export const registerStaleChunkReload = (
  target: EventTarget = window,
  reloader: (error: unknown) => boolean = reloadForStaleChunk
) => {
  const onPreloadError = (event: Event) => {
    reloader((event as Event & { payload?: unknown }).payload);
  };

  target.addEventListener('vite:preloadError', onPreloadError);

  return () => target.removeEventListener('vite:preloadError', onPreloadError);
};
