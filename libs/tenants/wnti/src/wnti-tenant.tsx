import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { wntiConfig } from './wnti-config';

/**
 * The Next flavour: `wntiConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const wntiTenant: WebsiteTenantConfig = {
  ...wntiConfig,
  builder: {
    ...wntiConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
