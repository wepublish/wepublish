import { gruppettoConfig } from '@wepublish/tenant/gruppetto';

/**
 * The `<title>` for routes that have no SEO component to set one.
 *
 * Next rendered a default title from `_app.tsx`, so `/a`, `/author`, `/search`
 * and friends all came out as the bare site title. Nothing here can do that
 * globally: React 19 hoists every `<title>` it renders without deduplicating,
 * and the browser takes the *first* in document order — a default in the
 * shell would therefore beat `PageSEO`/`ArticleSEO` on the routes that do set
 * one. Hence per route, only where nothing else will.
 */
export const defaultHead = () => ({
  meta: [{ title: gruppettoConfig.builder.meta?.siteTitle }],
});
