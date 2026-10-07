import { loadPackageSync } from '@nestjs/common/internal';

import * as expressFiveIntegration from '@as-integrations/express5';

/**
 * Pre-loads the optional peers Nest would otherwise resolve lazily.
 *
 * `loadPackage` runs the loader it is given — for the Apollo driver that is
 * `() => import('@as-integrations/express5')`, a dynamic ESM import. The API
 * ships as a @yao-pkg/pkg snapshot, which cannot resolve one, so the import
 * throws and Nest exits with 'The "@as-integrations/express5" package is
 * missing' even though the package is installed and bundled.
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
