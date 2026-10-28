import { render, screen } from '@testing-library/react';
import { de } from 'date-fns/locale';

import { EenewsBlockRenderer } from './components/block-renderer/eenews-block-renderer';
import { EeNewsBlockType } from './components/block-styles/eenews-block-styles';
import { EenewsBuilderPagination } from './components/eenews-builder-pagination';
import { EenewsContentWrapper } from './components/eenews-content-wrapper';
import { EenewsGlobalStyles } from './components/eenews-global-styles';
import { EenewsNavbar } from './components/eenews-navbar';
import { EenewsTeaser } from './components/teasers/eenews-teaser';
import { useAdsContext } from './context/ads-context';
import { eenewsTenant } from './eenews-tenant';
import deOverridden from './locales/deOverridden.json';
import theme from './theme';

const AdsState = () => {
  const { adsDisabled, reviveStatus } = useAdsContext();

  return (
    <p>
      {String(adsDisabled)} {reviveStatus}
    </p>
  );
};

describe('eenewsTenant', () => {
  it('identifies the tenant', () => {
    expect(eenewsTenant.id).toBe('eenews');
    expect(eenewsTenant.name).toBe('ee-news');
    expect(eenewsTenant.builder.meta?.siteTitle).toBe('ee-news.ch');
  });

  it('returns the eenews theme', () => {
    expect(eenewsTenant.createTheme()).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(eenewsTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverridden },
    });
    expect(eenewsTenant.dateLocale).toBe(de);
  });

  it('overrides the components, blocks and elements', () => {
    expect(eenewsTenant.builder.Navbar).toBe(EenewsNavbar);
    expect(eenewsTenant.builder.ContentWrapper).toBe(EenewsContentWrapper);
    expect(eenewsTenant.builder.blocks?.Renderer).toBe(EenewsBlockRenderer);
    expect(eenewsTenant.builder.blocks?.Teaser).toBe(EenewsTeaser);
    expect(eenewsTenant.builder.elements?.Pagination).toBe(
      EenewsBuilderPagination
    );
    expect(eenewsTenant.builder.elements?.Link).toBeDefined();
    expect(eenewsTenant.GlobalStyles).toBe(EenewsGlobalStyles);
  });

  it('lists the block styles its components understand', () => {
    expect(eenewsTenant.blockStyles).toEqual(Object.values(EeNewsBlockType));
  });

  it('does not inject next specific builder props', () => {
    expect(eenewsTenant.builder).not.toHaveProperty('Head');
    expect(eenewsTenant.builder).not.toHaveProperty('Script');
    expect(eenewsTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the eenews way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(eenewsTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(eenewsTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });

  it('wraps the website in the ads provider', () => {
    const Wrapper = eenewsTenant.Wrapper;

    expect(Wrapper).toBeDefined();

    if (!Wrapper) {
      return;
    }

    render(
      <Wrapper>
        <AdsState />
      </Wrapper>
    );

    expect(screen.getByText('false pending')).toBeDefined();
  });
});
