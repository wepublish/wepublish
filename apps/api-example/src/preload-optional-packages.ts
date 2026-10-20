import { loadPackageSync } from '@nestjs/common/internal';

import * as expressFiveIntegration from '@as-integrations/express5';

/**
 * Pre-loads the optional peers Nest would otherwise resolve lazily.
 *
 * `loadPackage` runs the loader it is given — for the Apollo driver that is
 * `() => import('@as-integrations/express5')`, a dynamic ESM import that never
 * shows up as a `require` in the bundle, so apps/api-example/package.json (the
 * bundle's runtime dependencies) would miss it and the image would exit with
 * 'The "@as-integrations/express5" package is missing'.
 *
 * `loadPackage` checks its package cache before calling the loader, and
 * `loadPackageSync` fills that cache from a static reference, so seeding it
 * here means the dynamic import never runs.
 *
 * Import this before `NestFactory.create`, so the cache is warm by the time
 * GraphQLModule initialises.
 */
export function preloadOptionalPackages() {
  loadPackageSync(
    '@as-integrations/express5',
    'GraphQLModule',
    () => expressFiveIntegration
  );
}
