import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { ganzgrazConfig } from './ganzgraz-config';

/**
 * The Next flavour: `ganzgrazConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const ganzgrazTenant: WebsiteTenantConfig = {
  ...ganzgrazConfig,
  builder: {
    ...ganzgrazConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
