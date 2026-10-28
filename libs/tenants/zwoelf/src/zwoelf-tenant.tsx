import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { ZwoelfBaseTeaser } from './components/zwoelf-base-teaser';
import { ZwoelfFocusTeaser } from './components/zwoelf-focus-teaser';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const zwoelfTenant: WebsiteTenantConfig = {
  id: 'zwoelf',
  name: 'Zwölf',
  createTheme: () => theme,
  builder: {
    elements: { Link: NextWepublishLink },
    blocks: { BaseTeaser: ZwoelfBaseTeaser },
    blockStyles: { FocusTeaser: ZwoelfFocusTeaser },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Zwölf' },
  },
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
