import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { eenewsConfig } from './eenews-config';

/**
 * The Next flavour: `eenewsConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const eenewsTenant: WebsiteTenantConfig = {
  ...eenewsConfig,
  builder: {
    ...eenewsConfig.builder,
    elements: { ...eenewsConfig.builder.elements, Link: NextWepublishLink },
  },
};
