import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { CourantGlobalStyles } from './components/courant-global-styles';
import { CourantBlocks } from './components/courant-blocks';
import { CourantContentWrapper } from './components/courant-content-wrapper';
import { CourantFooter } from './components/courant-footer';
import { CourantNavbar } from './components/courant-navbar';
import { CourantTitleBlock } from './components/courant-title-block';
import frOverridden from './locales/frOverridden.json';
import { createCourantTheme } from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: fr })} à ${format(date, 'HH:mm', { locale: fr })}`
  : format(date, 'dd. MMMM yyyy', { locale: fr });

export const courantTenant: WebsiteTenantConfig = {
  id: 'factuel',
  name: 'Courant',
  createTheme: createCourantTheme,
  builder: {
    ContentWrapper: CourantContentWrapper,
    Navbar: CourantNavbar,
    Footer: CourantFooter,
    blocks: {
      Blocks: CourantBlocks,
      Title: CourantTitleBlock,
    },
    elements: { Link: NextWepublishLink },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Courant', locale: 'fr-CH' },
  },
  translations: {
    lng: 'fr',
    overrides: { fr: frOverridden },
  },
  dateLocale: fr,
  GlobalStyles: CourantGlobalStyles,
};
