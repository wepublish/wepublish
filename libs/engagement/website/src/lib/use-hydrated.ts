import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/**
 * False while the server renders and while the page hydrates, true after. A
 * request that depends on cookies or storage waits for it, so it is sent once,
 * with what the browser holds, instead of once without and once with.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
