import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { culturConfig } from './cultur-config';

/**
 * The Next flavour: `culturConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const culturTenant: WebsiteTenantConfig = {
  ...culturConfig,
  builder: {
    ...culturConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
