import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { mergeDeepRight } from 'ramda';

import { CourantContentWrapper } from './components/courant-content-wrapper';
import { CourantFooter } from './components/courant-footer';
import { CourantNavbar } from './components/courant-navbar';
import frOverridden from './locales/frOverridden.json';
import courantTheme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: fr })} à ${format(date, 'HH:mm', { locale: fr })}`
  : format(date, 'dd. MMMM yyyy', { locale: fr });

export const courantTenant: WebsiteTenantConfig = {
  id: 'factuel',
  name: 'Courant',
  createTheme: settingsTheme =>
    createTheme(
      minimalTheme,
      mergeDeepRight(courantTheme, (settingsTheme ?? {}) as object)
    ),
  builder: {
    ContentWrapper: CourantContentWrapper,
    Navbar: CourantNavbar,
    Footer: CourantFooter,
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
