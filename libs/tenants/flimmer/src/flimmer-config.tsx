import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { FlimmerBreakBlock } from './components/flimmer-break-block';
import { FlimmerNavbar } from './components/flimmer-navbar';
import { FlimmerPaymentAmountPicker } from './components/flimmer-payment-amount-picker';
import { FlimmerRichText } from './components/flimmer-richtext';
import { FlimmerTeaser } from './components/flimmer-teaser';
import { FlimmerTitle } from './components/flimmer-title';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

/**
 * The tenant config without `elements.Link`.
 *
 * `flimmer-tenant.tsx` binds `NextWepublishLink`, which imports `next/link` and so
 * cannot be bundled by a non-Next app. The TanStack app supplies its own
 * router-aware `Link`; everything else is identical.
 */
export const flimmerConfig: WebsiteTenantConfig = {
  id: 'flimmer',
  name: 'Flimmer',
  createTheme: () => theme,
  builder: {
    Navbar: FlimmerNavbar,
    PaymentAmountPicker: FlimmerPaymentAmountPicker,
    blocks: {
      BaseTeaser: FlimmerTeaser,
      Break: FlimmerBreakBlock,
      RichText: FlimmerRichText,
      Title: FlimmerTitle,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Flimmer' },
  },
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
