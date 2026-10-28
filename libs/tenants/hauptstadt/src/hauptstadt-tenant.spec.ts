import { NextWepublishLink } from '@wepublish/utils/website/link';
import { de } from 'date-fns/locale';

import { FontSizeProvider } from './components/font-size-picker';
import { HauptstadtBlockRenderer } from './components/hauptstadt-block-renderer';
import { HauptstadtNavbar } from './components/hauptstadt-navbar';
import { HauptstadtFocusTeaser } from './components/hauptstadt-teaser';
import { hauptstadtTenant } from './hauptstadt-tenant';
import deOverriden from './locales/deOverriden.json';
import { HauptstadtPrintStyles } from './print-styles';
import theme from './theme';

describe('hauptstadtTenant', () => {
  it('identifies the tenant', () => {
    expect(hauptstadtTenant.id).toBe('hauptstadt');
    expect(hauptstadtTenant.name).toBe('Hauptstadt');
    expect(hauptstadtTenant.builder.meta?.siteTitle).toBe('Hauptstadt');
  });

  it('returns the hauptstadt theme', () => {
    expect(hauptstadtTenant.createTheme()).toBe(theme);
  });

  it('carries the german translations overrides and date locale', () => {
    expect(hauptstadtTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(hauptstadtTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar, the link and the block renderer', () => {
    expect(hauptstadtTenant.builder.Navbar).toBe(HauptstadtNavbar);
    expect(hauptstadtTenant.builder.elements?.Link).toBe(NextWepublishLink);
    expect(hauptstadtTenant.builder.blocks?.Renderer).toBe(
      HauptstadtBlockRenderer
    );
    expect(hauptstadtTenant.builder.blockStyles?.FocusTeaser).toBe(
      HauptstadtFocusTeaser
    );
  });

  it('lists the block styles its renderer understands', () => {
    expect(hauptstadtTenant.blockStyles).toEqual(['Center Text']);
  });

  it('wraps the page in the font size provider and adds the print styles', () => {
    expect(hauptstadtTenant.Wrapper).toBe(FontSizeProvider);
    expect(hauptstadtTenant.GlobalStyles).toBe(HauptstadtPrintStyles);
  });

  it('does not inject next specific builder props', () => {
    expect(hauptstadtTenant.builder).not.toHaveProperty('Head');
    expect(hauptstadtTenant.builder).not.toHaveProperty('Script');
    expect(hauptstadtTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the hauptstadt way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(hauptstadtTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(hauptstadtTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
