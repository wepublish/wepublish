import { Button, ThemeOptions } from '@mui/material';
import { screen } from '@testing-library/react';
import { mockTitleBlock, renderWithProviders } from '@wepublish/mocks/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { fr } from 'date-fns/locale';

import { CourantContentWrapper } from './components/courant-content-wrapper';
import { CourantFooter } from './components/courant-footer';
import { CourantNavbar } from './components/courant-navbar';
import { courantTenant } from './courant-tenant';
import websiteSettings from './fixtures/website-settings.json';
import frOverridden from './locales/frOverridden.json';

describe('courantTenant', () => {
  it('identifies the tenant', () => {
    expect(courantTenant.id).toBe('factuel');
    expect(courantTenant.builder.meta).toEqual({
      siteTitle: 'Courant',
      locale: 'fr-CH',
    });
  });

  it('builds the brand theme when no settings theme is given', () => {
    const theme = courantTenant.createTheme();

    expect(theme.palette.primary.main).toBe('#fdeb0b');
    // Type slots reference CSS custom props in CourantGlobalStyles
    expect(theme.typography.fontFamily).toBe('var(--courant-sans)');
    expect(theme.typography.teaserTitle.fontFamily).toBe(
      'var(--courant-display)'
    );
    expect(theme.typography.teaserTitle.fontWeight).toBe(
      'var(--courant-heading-weight)'
    );
    expect(theme.typography.blockBreakTitle.fontWeight).toBe(
      'var(--courant-heading-weight)'
    );
    expect(theme.typography.blockQuote.fontWeight).toBe(
      'var(--courant-heading-weight)'
    );
  });

  it('keeps the configured brand primary color and typography over CMS settings', () => {
    const theme = courantTenant.createTheme({
      palette: { primary: { main: '#123456', light: '#abcdef' } },
      typography: {
        fontFamily: 'Settings Font',
        h1: {
          fontFamily: 'Settings H1 Font',
          fontWeight: 900,
          fontSize: '42px',
        },
      },
    } as unknown as ThemeOptions);

    expect(theme.palette.primary.main).toBe('#fdeb0b');
    expect(theme.palette.primary.light).toBe('#abcdef');
    expect(theme.typography.fontFamily).toBe('var(--courant-sans)');
    expect(theme.typography.h1.fontFamily).toBe('var(--courant-display)');
    expect(theme.typography.h1.fontWeight).toBe(
      'var(--courant-heading-weight)'
    );
    expect(theme.typography.h1.fontSize).toBe('3.815rem');
  });

  it('carries the french translation overrides and date locale', () => {
    expect(courantTenant.translations).toEqual({
      lng: 'fr',
      overrides: { fr: frOverridden },
    });
    expect(courantTenant.dateLocale).toBe(fr);
  });

  it('overrides the components the app overrode', () => {
    expect(courantTenant.builder).toEqual(
      expect.objectContaining({
        ContentWrapper: CourantContentWrapper,
        Navbar: CourantNavbar,
        Footer: CourantFooter,
      })
    );
    expect(courantTenant.builder.elements?.Link).toBeDefined();
    expect(courantTenant.blockStyles).toBeUndefined();
  });

  it('does not inject next specific builder props', () => {
    expect(courantTenant.builder).not.toHaveProperty('Head');
    expect(courantTenant.builder).not.toHaveProperty('Script');
    expect(courantTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the Courant way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(courantTenant.builder.date?.format?.(date)).toBe(
      '05. janvier 2024 à 09:07'
    );
    expect(courantTenant.builder.date?.format?.(date, false)).toBe(
      '05. janvier 2024'
    );
  });
});

const settingsTheme = websiteSettings.theme as unknown as ThemeOptions;

const courantWithSettings = {
  ...courantTenant,
  createTheme: () => courantTenant.createTheme(settingsTheme),
};

const TenantPage = () => {
  const {
    ContentWrapper,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <ContentWrapper>
      <Button
        variant="contained"
        color="primary"
      >
        Abonner
      </Button>

      <Blocks
        blocks={[
          mockTitleBlock({ title: 'Ce qui fait bouger Genève cette semaine' }),
        ]}
        type="Page"
      />
    </ContentWrapper>
  );
};

describe('a page rendered with the Courant tenant and its website settings', () => {
  it('renders the configured brand primary colour', () => {
    renderWithProviders(<TenantPage />, { tenant: courantWithSettings });

    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Abonner' }))
        .backgroundColor
    ).toBe('#fdeb0b');
  });

  it('renders block titles using the brand display role', () => {
    renderWithProviders(<TenantPage />, { tenant: courantWithSettings });

    const style = getComputedStyle(
      screen.getByRole('heading', {
        name: 'Ce qui fait bouger Genève cette semaine',
      })
    );
    expect(style.fontFamily).toBe('local, serif');
    expect(style.fontWeight).toBe('500');
    expect(style.fontSize).toBe('61.04px');
  });
});
