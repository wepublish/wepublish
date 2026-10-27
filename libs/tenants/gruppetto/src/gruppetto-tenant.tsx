import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { gruppettoConfig } from './gruppetto-config';

export const gruppettoTenant: WebsiteTenantConfig = {
  ...gruppettoConfig,
  builder: {
    ...gruppettoConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
