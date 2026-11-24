/**
 * The `Referrer-Policy` the shared `next.config.js` sends, for an app's
 * request middleware in `src/start.ts`. Addresses that carry a token or a
 * login code, and the account pages behind them, send no referrer at all;
 * everything else sends only the origin to other sites.
 */
const NO_REFERRER = /^\/(login|confirm-email|welcome|profile)$|^\/(l|profile)\//;

export const referrerPolicyFor = (pathname: string) =>
  NO_REFERRER.test(pathname) ? 'no-referrer' : (
    'strict-origin-when-cross-origin'
  );
