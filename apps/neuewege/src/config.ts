import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

/**
 * Neue Wege has no `libs/tenants` library: its theme is the Website Settings
 * theme on top of `minimalTheme`, which is all `pages/_app.tsx` built inline.
 * No `elements.Link` — the app supplies its router-aware `Link`.
 */
export const neuewegeConfig: WebsiteTenantConfig = {
  id: 'neuewege',
  name: 'Neue Wege',
  createTheme: settingsTheme => createTheme(minimalTheme, settingsTheme ?? {}),
  builder: {
    date: { format: dateFormatter },
    meta: { siteTitle: 'Neue Wege' },
  },
  translations: {
    lng: 'de',
    overrides: {
      de: {
        // Neue Wege's Payrexx takes cards and TWINT
        paymentMethodLabels: {
          payrexx: 'Karte oder TWINT',
          'payrexx-subscription': 'Karte oder TWINT',
        },
      },
    },
  },
  dateLocale: de,
};
