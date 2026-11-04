import {
  createStaleChunkReloader,
  isStaleChunkError,
  registerStaleChunkReload,
} from './stale-chunk';

const staleChunk = new TypeError(
  'Failed to fetch dynamically imported module: https://mannschaft.com/assets/react-ClMIVUoL.js'
);

const memoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
};

describe('isStaleChunkError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/a.js',
    'error loading dynamically imported module: https://x/assets/a.js',
    'Importing a module script failed.',
    'Unable to preload CSS for https://x/assets/a.css',
  ])('recognises "%s"', message => {
    expect(isStaleChunkError(new TypeError(message))).toBe(true);
  });

  it('ignores any other error', () => {
    expect(isStaleChunkError(new Error('boom'))).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });
});

describe('createStaleChunkReloader', () => {
  it('reloads the page for a stale chunk', () => {
    const reload = vi.fn();
    const reloadForStaleChunk = createStaleChunkReloader({
      storage: memoryStorage(),
      reload,
      now: () => 1_000_000,
    });

    expect(reloadForStaleChunk(staleChunk)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('leaves any other error alone', () => {
    const reload = vi.fn();
    const reloadForStaleChunk = createStaleChunkReloader({
      storage: memoryStorage(),
      reload,
      now: () => 1_000_000,
    });

    expect(reloadForStaleChunk(new Error('boom'))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('keeps reporting a reload as pending once one is under way', () => {
    const reload = vi.fn();
    const reloadForStaleChunk = createStaleChunkReloader({
      storage: memoryStorage(),
      reload,
      now: () => 1_000_000,
    });

    reloadForStaleChunk(staleChunk);

    expect(reloadForStaleChunk(staleChunk)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not loop when the chunk is still missing after the reload', () => {
    const storage = memoryStorage();
    const reload = vi.fn();

    createStaleChunkReloader({ storage, reload, now: () => 1_000_000 })(
      staleChunk
    );

    const afterReload = createStaleChunkReloader({
      storage,
      reload,
      now: () => 1_005_000,
    });

    expect(afterReload(staleChunk)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again for a later deploy in the same session', () => {
    const storage = memoryStorage();
    const reload = vi.fn();

    createStaleChunkReloader({ storage, reload, now: () => 1_000_000 })(
      staleChunk
    );

    const muchLater = createStaleChunkReloader({
      storage,
      reload,
      now: () => 1_000_000 + 60 * 60 * 1000,
    });

    expect(muchLater(staleChunk)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('still reloads when session storage is unavailable', () => {
    const reload = vi.fn();
    const reloadForStaleChunk = createStaleChunkReloader({
      storage: {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => {
          throw new Error('SecurityError');
        },
      },
      reload,
      now: () => 1_000_000,
    });

    expect(reloadForStaleChunk(staleChunk)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('registerStaleChunkReload', () => {
  it('hands a failed vite preload to the reloader', () => {
    const reloadForStaleChunk = vi.fn(() => true);
    const target = new EventTarget();
    const unregister = registerStaleChunkReload(target, reloadForStaleChunk);

    const event = Object.assign(
      new Event('vite:preloadError', { cancelable: true }),
      { payload: staleChunk }
    );
    target.dispatchEvent(event);

    expect(reloadForStaleChunk).toHaveBeenCalledWith(staleChunk);

    unregister();
    target.dispatchEvent(event);

    expect(reloadForStaleChunk).toHaveBeenCalledTimes(1);
  });
});
