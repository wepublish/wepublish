import { de } from 'date-fns/locale';

import { TsriTabbedContentType } from './components/block-layouts/tsri-base-tabbed-content';
import { TsriBreakBlockType } from './components/break-blocks/tsri-base-break-block';
import { TsriLayoutType } from './components/teaser-layouts/tsri-layout';
import { TsriTeaserType } from './components/teasers/tsri-base-teaser';
import { TsriV2Navbar } from './components/tsri-v2-navbar';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';
import { tsriTenant } from './tsri-tenant';

describe('tsriTenant', () => {
  it('identifies the tenant', () => {
    expect(tsriTenant.id).toBe('tsri');
    expect(tsriTenant.builder.meta?.siteTitle).toBe('Tsri');
  });

  it('returns the tsri theme', () => {
    expect(tsriTenant.createTheme()).toBe(theme);
  });

  it('carries the german translations overrides and date locale', () => {
    expect(tsriTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(tsriTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar and the block renderer', () => {
    expect(tsriTenant.builder.Navbar).toBe(TsriV2Navbar);
    expect(tsriTenant.builder.blocks?.Renderer).toBeDefined();
    expect(tsriTenant.builder.blockStyles?.ContextBox).toBeDefined();
  });

  it('lists the block styles its renderer understands', () => {
    expect(tsriTenant.blockStyles).toEqual(
      expect.arrayContaining([
        TsriTeaserType.HeroTeaser,
        TsriTeaserType.CompactNews,
        TsriBreakBlockType.AttentionCatcher,
        TsriBreakBlockType.SidebarContent,
        TsriLayoutType.Dossier,
        TsriLayoutType.XLFullsizeImage,
        TsriTabbedContentType.TabbedMainContent,
      ])
    );
    expect(new Set(tsriTenant.blockStyles).size).toBe(
      tsriTenant.blockStyles?.length
    );
  });

  it('does not inject next specific builder props', () => {
    expect(tsriTenant.builder).not.toHaveProperty('Head');
    expect(tsriTenant.builder).not.toHaveProperty('Script');
    expect(tsriTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the tsri way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(tsriTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 | 09:07'
    );
    expect(tsriTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
