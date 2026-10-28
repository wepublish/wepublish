import { PublicEnv, WebsiteSettingsFragment } from '@wepublish/website/api';

/**
 * Globals the server render writes into the HTML shell and the client reads
 * back.
 *
 * This augmentation lives in the framework-neutral core on purpose. It used to
 * sit in `pages/document-page.tsx`, which is Next-only; once a non-Next app
 * stopped importing the Next barrel the augmentation left its type graph and
 * `window.WEBSITE_SETTINGS = …` no longer compiled.
 *
 * `PUBLIC_ENV` is also declared by `@wepublish/website/api`; identical
 * declarations merge, so both can coexist.
 */
declare global {
  interface Window {
    WEBSITE_SETTINGS: WebsiteSettingsFragment | undefined;
    PUBLIC_ENV: PublicEnv | undefined;
  }
}

export {};
