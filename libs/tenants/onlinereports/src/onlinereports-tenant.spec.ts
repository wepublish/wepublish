import { de } from 'date-fns/locale';

import { IsAktuelleBildTeasers } from './block-styles/aktuelle-bild';
import { isGelesenUndGedacthTeasers } from './block-styles/gelesen-und-gedacht';
import { isHighlightTeasers } from './block-styles/highlight';
import { isNewsTeasers } from './block-styles/news';
import { isRuckSpiegelTeasers } from './block-styles/ruck-spiegel';
import { OnlineReportsTitleBlock } from './components/title-block';
import { AdsProvider } from './context/ads-context';
import deOverridden from './locales/deOverridden.json';
import { OnlineReportsNavbar } from './navigation/onlinereports-navbar';
import { OnlineReportsBlockRenderer } from './onlinereports-block-renderer';
import { OnlineReportsGlobalStyles } from './onlinereports-global-styles';
import { onlinereportsTenant } from './onlinereports-tenant';
import theme from './theme';

describe('onlinereportsTenant', () => {
  it('identifies the tenant', () => {
    expect(onlinereportsTenant.id).toBe('onlinereports');
    expect(onlinereportsTenant.builder.meta?.siteTitle).toBe('OnlineReports');
  });

  it('returns the onlinereports theme', () => {
    expect(onlinereportsTenant.createTheme()).toBe(theme);
  });

  it('carries the german translations overrides and date locale', () => {
    expect(onlinereportsTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverridden },
    });
    expect(onlinereportsTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar, the block renderer and the title block', () => {
    expect(onlinereportsTenant.builder.Navbar).toBe(OnlineReportsNavbar);
    expect(onlinereportsTenant.builder.blocks?.Renderer).toBe(
      OnlineReportsBlockRenderer
    );
    expect(onlinereportsTenant.builder.blocks?.Title).toBe(
      OnlineReportsTitleBlock
    );
  });

  it('provides the ads context and the global styles', () => {
    expect(onlinereportsTenant.Wrapper).toBe(AdsProvider);
    expect(onlinereportsTenant.GlobalStyles).toBe(OnlineReportsGlobalStyles);
  });

  it('lists exactly the block styles its renderer understands', () => {
    const predicates = [
      isHighlightTeasers,
      isNewsTeasers,
      isRuckSpiegelTeasers,
      isGelesenUndGedacthTeasers,
      IsAktuelleBildTeasers,
    ];

    expect(onlinereportsTenant.blockStyles).toHaveLength(predicates.length);

    for (const blockStyle of onlinereportsTenant.blockStyles ?? []) {
      const block = { __typename: 'TeaserListBlock' as const, blockStyle };

      expect(
        predicates.filter(isBlockStyle => isBlockStyle(block))
      ).toHaveLength(1);
    }
  });

  it('does not inject next specific builder props', () => {
    expect(onlinereportsTenant.builder).not.toHaveProperty('Head');
    expect(onlinereportsTenant.builder).not.toHaveProperty('Script');
    expect(onlinereportsTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the onlinereports way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(onlinereportsTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(onlinereportsTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
