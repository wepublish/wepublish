import { ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import { de } from 'date-fns/locale';

import { WepBlockStyles } from './components/block-styles/wep-block-styles';
import { WepBreakBlock } from './components/break-blocks/wep-break-block';
import { WepBaseTeaserSlots } from './components/teaser-layouts/wep-base-teaser-slots';
import { WepBaseTeaser } from './components/teasers/wep-base-teaser';
import { WepArticle } from './components/wep-article';
import { WepBlockRenderer } from './components/wep-block-renderer';
import { WepContentWrapper } from './components/wep-content-wrapper';
import { WepFooter } from './components/wep-footer';
import { WepLink } from './components/wep-link';
import { WepNavbar } from './components/wep-navbar';
import { WepPage } from './components/wep-page';
import { WepQuoteBlock } from './components/wep-quote-block';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';
import { wepublishSiteTenant } from './wepublish-site-tenant';

const router = vi.hoisted(() => ({ asPath: '/' }));

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const renderGlobalStyles = (asPath: string) => {
  router.asPath = asPath;
  const { GlobalStyles } = wepublishSiteTenant;

  if (!GlobalStyles) {
    throw new Error('missing global styles');
  }

  return render(
    <ThemeProvider theme={wepublishSiteTenant.createTheme()}>
      <GlobalStyles />
    </ThemeProvider>
  );
};

const globalCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent)
    .join('');

describe('wepublishSiteTenant', () => {
  it('identifies the tenant', () => {
    expect(wepublishSiteTenant.id).toBe('wepublish-site');
    expect(wepublishSiteTenant.builder.meta?.siteTitle).toBe('We.Publish');
  });

  it('returns the we.publish site theme', () => {
    expect(wepublishSiteTenant.createTheme()).toBe(theme);
  });

  it('carries the german translations overrides and date locale', () => {
    expect(wepublishSiteTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(wepublishSiteTenant.dateLocale).toBe(de);
  });

  it('passes the same builder components as the app did', () => {
    expect(wepublishSiteTenant.builder).toMatchObject({
      Footer: WepFooter,
      Navbar: WepNavbar,
      ContentWrapper: WepContentWrapper,
      Article: WepArticle,
      Page: WepPage,
      blocks: {
        Renderer: WepBlockRenderer,
        BaseTeaser: WepBaseTeaser,
        TeaserSlots: WepBaseTeaserSlots,
        Quote: WepQuoteBlock,
        Break: WepBreakBlock,
      },
      elements: { Link: WepLink },
    });
  });

  it('lists the block styles its renderer understands', () => {
    expect(wepublishSiteTenant.blockStyles).toEqual(
      Object.values(WepBlockStyles)
    );
  });

  it('does not inject next specific builder props', () => {
    expect(wepublishSiteTenant.builder).not.toHaveProperty('Head');
    expect(wepublishSiteTenant.builder).not.toHaveProperty('Script');
    expect(wepublishSiteTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the we.publish way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(wepublishSiteTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(wepublishSiteTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });

  it('paints the home page gradient only on the home page', () => {
    const home = renderGlobalStyles('/');
    expect(globalCss()).toContain('linear-gradient');
    home.unmount();

    renderGlobalStyles('/a/some-article');
    expect(globalCss()).not.toContain('linear-gradient');
    expect(globalCss()).toContain('--breakpoint-width');
  });
});
