import { de } from 'date-fns/locale';

import { TsriArticleMeta } from './components/tsri-article-meta';
import { TsriBreakBlock } from './components/tsri-break-block';
import { TsriContextBox } from './components/tsri-context-box';
import { TsriNavbar } from './components/tsri-navbar';
import { TsriQuoteBlock } from './components/tsri-quote-block';
import { TsriRichText } from './components/tsri-richtext';
import { TsriTeaser } from './components/tsri-teaser';
import { WntiPaymentAmountPicker } from './components/wnti-payment-amount-picker';
import { WntiTitleBlock } from './components/wnti-title-block';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';
import { wntiTenant } from './wnti-tenant';

describe('wntiTenant', () => {
  it('identifies the tenant', () => {
    expect(wntiTenant.id).toBe('wnti');
    expect(wntiTenant.builder.meta?.siteTitle).toBe('WNTI');
  });

  it('returns the wnti theme', () => {
    expect(wntiTenant.createTheme()).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(wntiTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(wntiTenant.dateLocale).toBe(de);
  });

  it('passes the same components the app passed', () => {
    expect(wntiTenant.builder.Navbar).toBe(TsriNavbar);
    expect(wntiTenant.builder.ArticleMeta).toBe(TsriArticleMeta);
    expect(wntiTenant.builder.PaymentAmountPicker).toBe(
      WntiPaymentAmountPicker
    );
    expect(wntiTenant.builder.elements?.Link).toBeDefined();
    expect(wntiTenant.builder.blocks).toEqual({
      BaseTeaser: TsriTeaser,
      Break: TsriBreakBlock,
      Quote: TsriQuoteBlock,
      RichText: TsriRichText,
      Title: WntiTitleBlock,
    });
    expect(wntiTenant.builder.blockStyles).toEqual({
      ContextBox: TsriContextBox,
    });
  });

  it('lists the block styles it styles itself', () => {
    expect(wntiTenant.blockStyles).toEqual(['ContextBox']);
  });

  it('does not inject next specific builder props', () => {
    expect(wntiTenant.builder).not.toHaveProperty('Head');
    expect(wntiTenant.builder).not.toHaveProperty('Script');
    expect(wntiTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the wnti way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(wntiTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(wntiTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
