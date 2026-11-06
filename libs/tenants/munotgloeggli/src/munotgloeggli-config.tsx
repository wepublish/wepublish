import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { mergeDeepRight } from 'ramda';

import { MunotgloeggliCrowdfundingBlock } from './components/website-builder-overwrites/blocks/crowdfunding';
import { MunotgloeggliBaseTeaser } from './components/website-builder-overwrites/blocks/teaser';
import deOverriden from './locales/deOverriden.json';
import fontTheme, { MunotgloeggliGlobalStyles } from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

/**
 * The tenant config without `elements.Link`.
 *
 * `munotgloeggli-tenant.tsx` binds `NextWepublishLink`, which imports `next/link` and so
 * cannot be bundled by a non-Next app. The TanStack app supplies its own
 * router-aware `Link`; everything else is identical.
 */
export const munotgloeggliConfig: WebsiteTenantConfig = {
  id: 'munotgloeggli',
  name: 'Munotglöggli',
  GlobalStyles: MunotgloeggliGlobalStyles,
  createTheme: settingsTheme =>
    createTheme(
      minimalTheme,
      mergeDeepRight(fontTheme, (settingsTheme ?? {}) as object)
    ),
  builder: {
    date: { format: dateFormatter },
    meta: { siteTitle: 'Munotglöggli' },
    blocks: {
      BaseTeaser: MunotgloeggliBaseTeaser,
      Crowdfunding: MunotgloeggliCrowdfundingBlock,
    },
  },
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
