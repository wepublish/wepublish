import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { NextWepublishLink } from '@wepublish/utils/website/link';
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

export const factuelTenant: WebsiteTenantConfig = {
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
    elements: { Link: NextWepublishLink },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Courant', locale: 'fr-CH' },
  },
  translations: {
    lng: 'fr',
    overrides: { fr: frOverridden },
  },
  dateLocale: fr,
};
