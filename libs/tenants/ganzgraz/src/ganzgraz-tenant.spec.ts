import { minimalTheme } from '@wepublish/ui';
import { de } from 'date-fns/locale';

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
import { ganzgrazTenant } from './ganzgraz-tenant';
import deOverriden from './locales/deOverriden.json';

describe('ganzgrazTenant', () => {
  it('identifies the tenant', () => {
    expect(ganzgrazTenant.id).toBe('ganzgraz');
    expect(ganzgrazTenant.builder.meta).toEqual({
      siteTitle: 'Der Graz-Newsletter von ganzgraz',
      locale: 'de-AT',
    });
  });

  it('builds the ganzgraz theme on top of the minimal theme', () => {
    const theme = ganzgrazTenant.createTheme();

    expect(theme.palette.primary.main).toBe(minimalTheme.palette.primary.main);
    expect(theme.typography.h1).toEqual(
      expect.objectContaining({
        [minimalTheme.breakpoints.up('md')]: { fontSize: '2.25rem' },
      })
    );
  });

  it('lets the website settings theme win over the ganzgraz theme', () => {
    const theme = ganzgrazTenant.createTheme({
      palette: { primary: { main: '#123456' } },
      typography: {
        h1: { fontFamily: 'Settings Font' },
      },
    });

    expect(theme.palette.primary.main).toBe('#123456');
    expect(theme.typography.h1).toEqual(
      expect.objectContaining({
        fontFamily: 'Settings Font',
        [minimalTheme.breakpoints.up('md')]: { fontSize: '2.25rem' },
      })
    );
  });

  it('carries the german translations overrides and date locale', () => {
    expect(ganzgrazTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(ganzgrazTenant.dateLocale).toBe(de);
  });

  it('overrides the components the app overrode', () => {
    expect(ganzgrazTenant.builder).toEqual(
      expect.objectContaining({
        Author: GanzGrazAuthor,
        PaymentAmountPicker: GanzGrazPaymentAmountPicker,
        TransactionFee: GanzGrazTransactionFee,
        EventListItem: GanzGrazEventListItem,
        Event: GanzGrazEvent,
        ContentWrapper: GanzGrazContentWrapper,
      })
    );
    expect(ganzgrazTenant.builder.elements?.Link).toBeDefined();
    expect(ganzgrazTenant.builder.blocks).toEqual({
      TeaserSlots: GanzGrazTeaserSlots,
      BaseTeaser: GanzGrazBaseTeaser,
      Break: GanzgrazBreakBlock,
    });
  });

  it('lists the block styles its renderer understands', () => {
    expect(ganzgrazTenant.blockStyles).toEqual([GanzGrazBlockStyles.LogoWall]);
  });

  it('does not inject next specific builder props', () => {
    expect(ganzgrazTenant.builder).not.toHaveProperty('Head');
    expect(ganzgrazTenant.builder).not.toHaveProperty('Script');
    expect(ganzgrazTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the ganzgraz way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(ganzgrazTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(ganzgrazTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
