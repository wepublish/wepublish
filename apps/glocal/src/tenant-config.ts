import { createTheme, ThemeOptions } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import {
  formatInSiteTimeZone,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${formatInSiteTimeZone(date, 'dd. MMMM yyyy')} um ${formatInSiteTimeZone(date, 'HH:mm')}`
  : formatInSiteTimeZone(date, 'dd. MMMM yyyy');

/**
 * What the Next `pages/_app.tsx` set up inline. glocal has no tenant lib: the
 * palette and fonts come from the CMS website settings, layered over
 * `minimalTheme` — so unlike most tenants, `createTheme` *does* read
 * `settingsTheme`, and `app.tsx` must pass it.
 */
export const glocalConfig: WebsiteTenantConfig = {
  id: 'glocal',
  name: 'glocal',
  createTheme: (settingsTheme?: ThemeOptions) =>
    createTheme(minimalTheme, settingsTheme ?? {}),
  builder: {
    date: { format: dateFormatter },
    meta: { siteTitle: 'We.Publish' },
  },
  translations: { lng: 'de' },
  dateLocale: de,
};
