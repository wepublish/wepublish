// Framework-neutral exports. Anything that does not import `next/*` lives in
// `./core` so Vite-based apps (TanStack Start) can import it without dragging
// Next.js into their bundle.
export * from './core';

// Next.js specific exports below. Importing this barrel from a non-Next app
// will fail to bundle — use `@wepublish/utils/website/core` there instead.
export * from './lib/auth-guard';
export * from './lib/get-session-token-props';
export * from './lib/next-wepublish-link';

export * from './lib/pages/profile/profile-page';
export * from './lib/pages/profile/subscription/subscription-page';
export * from './lib/pages/profile/subscription/deactivated-subscriptions-page';
export * from './lib/pages/404-page';
export * from './lib/pages/author-page';
export * from './lib/pages/subscribe-page';
export * from './lib/pages/search-page';
export * from './lib/pages/tag-page';
export * from './lib/pages/document-page';

export * from './lib/routed-admin-bar';
export * from './lib/handle-jwt-login';
export * from './lib/with-builder-router';
