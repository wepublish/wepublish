import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { ZwoelfBaseTeaser } from './components/zwoelf-base-teaser';
import { ZwoelfFocusTeaser } from './components/zwoelf-focus-teaser';
import { ZwoelfGoodiePicker } from './components/zwoelf-goodie-picker';
import { ZwoelfMemberPlanPicker } from './components/zwoelf-memberplan-picker';
import { ZwoelfPeriodicityPicker } from './components/zwoelf-periodicity-picker';
import { ZwoelfSubscribeBlock } from './components/zwoelf-subscribe-block';
import { ZwoelfSubscribeSummary } from './components/zwoelf-subscribe-summary';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

/**
 * The tenant config without `elements.Link`.
 *
 * `zwoelf-tenant.tsx` binds `NextWepublishLink`, which imports `next/link` and
 * so cannot be bundled by a non-Next app. The TanStack app supplies its own
 * router-aware `Link`; everything else is identical.
 */
export const zwoelfConfig: WebsiteTenantConfig = {
  id: 'zwoelf',
  name: 'Zwölf',
  createTheme: () => theme,
  builder: {
    blocks: { BaseTeaser: ZwoelfBaseTeaser, Subscribe: ZwoelfSubscribeBlock },
    blockStyles: { FocusTeaser: ZwoelfFocusTeaser },
    MemberPlanPicker: ZwoelfMemberPlanPicker,
    PeriodicityPicker: ZwoelfPeriodicityPicker,
    GoodiePicker: ZwoelfGoodiePicker,
    SubscribeSummary: ZwoelfSubscribeSummary,
    date: { format: dateFormatter },
    meta: { siteTitle: 'Zwölf' },
  },
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
