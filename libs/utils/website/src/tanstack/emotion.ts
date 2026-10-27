import createCache from '@emotion/cache';
import { createIsomorphicFn } from '@tanstack/react-start';

import { EMOTION_KEY, getRequestEmotionCache } from './emotion-ssr';

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
  .server(() => getRequestEmotionCache() ?? createCache({ key: EMOTION_KEY }))
  .client(() =>
    createCache({
      key: EMOTION_KEY,
      speedy: true,
      insertionPoint:
        document.querySelector<HTMLElement>(
          'meta[name="emotion-insertion-point"]'
        ) ?? undefined,
    })
  );
