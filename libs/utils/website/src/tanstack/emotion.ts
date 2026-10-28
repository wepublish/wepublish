import createCache from '@emotion/cache';
import { createIsomorphicFn } from '@tanstack/react-start';

/** Kept in sync with `emotion-ssr.ts`, which must not be imported here. */
export const EMOTION_KEY = 'css';

/**
 * The emotion cache the document renders with.
 *
 * On the server this is the per-request cache `withEmotionExtraction` created,
 * so the rules it collects are the ones extracted into `<head>` — see
 * `emotion-ssr.ts` for why extraction rather than emotion's inline `<style>`
 * tags. `createIsomorphicFn` is what keeps `node:async_hooks` out of the
 * browser bundle: the server branch and its imports are stripped from the
 * client build.
 *
 * In the browser this runs once. `createCache` adopts the `<style
 * data-emotion>` tags the server emitted, so hydration does not duplicate
 * them, and `insertionPoint` (replacing the deprecated `prepend`) puts
 * anything inserted afterwards in the same place.
 */
export const getRenderEmotionCache = createIsomorphicFn()
  // The fallback only matters if something renders the document outside
  // `withEmotionExtraction`. It deliberately leaves `compat` off, so emotion
  // emits its `<style>` tags inline: nothing would extract them, and an
  // unstyled page is the worse failure.
  .server(
    () =>
      globalThis.__wepublishRequestEmotionCache?.() ??
      createCache({ key: EMOTION_KEY })
  )
  .client(() => {
    const cache = createCache({
      key: EMOTION_KEY,
      speedy: true,
      insertionPoint:
        document.querySelector<HTMLElement>(
          'meta[name="emotion-insertion-point"]'
        ) ?? undefined,
    });

    // Same flag the server cache carries, for the same reason: something else
    // owns where the rules go. In the browser that is the sheet at
    // `insertionPoint`, in `<head>`, so nothing is ever interleaved with the
    // markup and emotion's ":nth-child is potentially unsafe when doing
    // server-side rendering" warning is a false positive here — it is guarded
    // on `compat` alone and would otherwise fire on every hydrated style.
    cache.compat = true;

    return cache;
  });
