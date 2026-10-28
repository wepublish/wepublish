import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { mergeDeepRight } from 'ramda';

import { MunotgloeggliCrowdfundingBlock } from './components/website-builder-overwrites/blocks/crowdfunding';
import { MunotgloeggliBaseTeaser } from './components/website-builder-overwrites/blocks/teaser';
import deOverriden from './locales/deOverriden.json';
import fontTheme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const munotgloeggliTenant: WebsiteTenantConfig = {
  id: 'munotgloeggli',
  name: 'Munotglöggli',
  createTheme: settingsTheme =>
    createTheme(
      minimalTheme,
      mergeDeepRight(fontTheme, (settingsTheme ?? {}) as object)
    ),
  builder: {
    elements: { Link: NextWepublishLink },
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
