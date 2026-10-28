import { createTheme } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { mergeDeepRight } from 'ramda';

import { GanzGrazBlockStyles } from './components/block-styles/ganzgraz-block-styles';
import { GanzGrazAuthor } from './components/ganzgraz-author';
import { GanzgrazBreakBlock } from './components/ganzgraz-break-block';
import { GanzGrazContentWrapper } from './components/ganzgraz-content-wrapper';
import { GanzGrazEvent } from './components/ganzgraz-event';
import { GanzGrazEventListItem } from './components/ganzgraz-event-list-item';
import { GanzGrazPaymentAmountPicker } from './components/ganzgraz-payment-amount-picker';
import { GanzGrazTransactionFee } from './components/ganzgraz-transaction-fee';
import { GanzGrazTeaserSlots } from './components/teaser-layouts/ganzgraz-base-teaser-slots';
import { GanzGrazBaseTeaser } from './components/teasers/ganzgraz-base-teaser';
import deOverriden from './locales/deOverriden.json';
import ganzgrazTheme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const ganzgrazTenant: WebsiteTenantConfig = {
  id: 'ganzgraz',
  name: 'ganzgraz',
  createTheme: settingsTheme =>
    createTheme(
      minimalTheme,
      mergeDeepRight(ganzgrazTheme, (settingsTheme ?? {}) as object)
    ),
  builder: {
    Author: GanzGrazAuthor,
    PaymentAmountPicker: GanzGrazPaymentAmountPicker,
    TransactionFee: GanzGrazTransactionFee,
    EventListItem: GanzGrazEventListItem,
    Event: GanzGrazEvent,
    ContentWrapper: GanzGrazContentWrapper,
    elements: { Link: NextWepublishLink },
    blocks: {
      TeaserSlots: GanzGrazTeaserSlots,
      BaseTeaser: GanzGrazBaseTeaser,
      Break: GanzgrazBreakBlock,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Der Graz-Newsletter von ganzgraz', locale: 'de-AT' },
  },
  blockStyles: Object.values(GanzGrazBlockStyles),
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
