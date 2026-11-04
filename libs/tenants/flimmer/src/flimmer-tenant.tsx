import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { flimmerConfig } from './flimmer-config';

/**
 * The Next flavour: `flimmerConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const flimmerTenant: WebsiteTenantConfig = {
  ...flimmerConfig,
  builder: {
    ...flimmerConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
