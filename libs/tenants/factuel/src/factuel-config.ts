import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { mergeDeepRight } from 'ramda';

import { FactuelContentWrapper } from './components/factuel-content-wrapper';
import { FactuelFooter } from './components/factuel-footer';
import { FactuelNavbar } from './components/factuel-navbar';
import frOverridden from './locales/frOverridden.json';
import factuelTheme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: fr })} à ${format(date, 'HH:mm', { locale: fr })}`
  : format(date, 'dd. MMMM yyyy', { locale: fr });

/**
 * The framework-neutral half of `factuelTenant`: everything but the Next link,
 * so the TanStack app can use it without pulling in `next/link`.
 */
export const factuelConfig: WebsiteTenantConfig = {
  id: 'factuel',
  name: 'Courant',
  createTheme: settingsTheme =>
    createTheme(
      minimalTheme,
      mergeDeepRight(factuelTheme, (settingsTheme ?? {}) as object)
    ),
  builder: {
    ContentWrapper: FactuelContentWrapper,
    Navbar: FactuelNavbar,
    Footer: FactuelFooter,
    date: { format: dateFormatter },
    meta: { siteTitle: 'Courant', locale: 'fr-CH' },
  },
  translations: {
    lng: 'fr',
    overrides: { fr: frOverridden },
  },
  dateLocale: fr,
};
