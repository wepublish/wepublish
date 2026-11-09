import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { munotgloeggliConfig } from './munotgloeggli-config';

/**
 * The Next flavour: `munotgloeggliConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift while both
 * apps exist.
 */
export const munotgloeggliTenant: WebsiteTenantConfig = {
  ...munotgloeggliConfig,
  builder: {
    ...munotgloeggliConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
