import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { mannschaftConfig } from './mannschaft-config';

/**
 * The Next flavour: `mannschaftConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const mannschaftTenant: WebsiteTenantConfig = {
  ...mannschaftConfig,
  builder: {
    ...mannschaftConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
