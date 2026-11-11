import createCache from '@emotion/cache';
import type { EmotionCache } from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { AsyncLocalStorage } from 'node:async_hooks';

import { EMOTION_KEY } from './emotion';

/**
 * Server-side emotion extraction — the TanStack half of what
 * `@mui/material-nextjs`'s `AppCacheProvider` plus `_document`'s
 * `documentGetInitialProps` did for the Next tenants.
 *
 * ## Why extraction rather than emotion's inline `<style>` tags
 *
 * Left to itself, emotion server-renders a `<style>` element next to every
 * component it styles, inside the same parent. On one article that puts 80
 * elements directly after a sibling `<style>`, and any rule keyed on
 * `:first-child` — `libs/richtext/website/.../render-element.tsx` has one —
 * silently stops matching. That is what emotion's "`:first-child` is
 * potentially unsafe when doing server-side rendering" warning is about, and
 * it is a real hazard here, not noise.
 *
 * The shared component libraries are written against the model every other
 * tenant runs: styles in `<head>`, nothing interleaved. Extracting here keeps
 * one styling model across all tenants instead of giving this one its own CSS
 * semantics.
 *
 * `cache.compat` is the other half of the contract. It tells emotion that
 * something else is collecting the rules, so it records them in
 * `cache.inserted` instead of rendering them into the tree. Setting it
 * *without* this wrapper is what left the page unstyled until hydration.
 *
 * ## The cost
 *
 * Extraction needs the finished markup, so the HTML response is buffered
 * rather than streamed. That trades some time-to-first-byte for a styled
 * first paint; the page cache in front of this serves the buffered copy
 * afterwards either way.
 */
const storage = new AsyncLocalStorage<EmotionCache>();

/**
 * Handed over on `globalThis` rather than exported.
 *
 * `emotion.ts` runs in both worlds and must not *import* this module: in a
 * production build the isomorphic transform strips the server branch and its
 * imports, but `vite dev` leaves them, and `@emotion/server` reaches
 * `html-tokenize`, which needs `Buffer`. That lands in the browser as
 * "Buffer is not defined", hydration dies, and every effect — including the
 * one sizing image captions — silently never runs.
 */
declare global {
  // eslint-disable-next-line no-var
  var __wepublishRequestEmotionCache:
    (() => EmotionCache | undefined) | undefined;
}

globalThis.__wepublishRequestEmotionCache = () => storage.getStore();

const HEAD_CLOSE = '</head>';

const isHtml = (response: Response) =>
  !!response.headers.get('content-type')?.includes('text/html');

type Fetch<TOptions> = (
  request: Request,
  opts?: TOptions
) => Response | Promise<Response>;

/** Wraps a server entry's fetch so emotion's rules end up in `<head>`. */
export const withEmotionExtraction =
  <TOptions>(fetch: Fetch<TOptions>): Fetch<TOptions> =>
  async (request, opts) => {
    const cache = createCache({ key: EMOTION_KEY });
    cache.compat = true;

    const response = await storage.run(cache, () => fetch(request, opts));

    if (!isHtml(response) || !response.body) {
      return response;
    }

    const html = await response.text();
    const { constructStyleTagsFromChunks, extractCriticalToChunks } =
      createEmotionServer(cache);
    const styles = constructStyleTagsFromChunks(extractCriticalToChunks(html));

    // `</head>` is always present: the root route renders the document shell.
    // Appending rather than prepending keeps emotion after the stylesheet
    // Vite extracts, which is the order the browser cache reproduces.
    const withStyles = html.replace(HEAD_CLOSE, `${styles}${HEAD_CLOSE}`);

    const headers = new Headers(response.headers);
    headers.delete('content-length');

    return new Response(withStyles, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
