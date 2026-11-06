import { Button, ThemeOptions, Typography } from '@mui/material';
import { screen } from '@testing-library/react';
import {
  mockCustomTeaser,
  mockFlexAlignment,
  mockImage,
  mockNavigations,
  renderWithProviders,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { CourantColorOverrides } from '../brand-colors';
import { courantConfig } from '../courant-config';
import { createCourantTheme } from '../theme';
import { CourantFooter } from './courant-footer';

const BrandPage = ({ withImage = false }: { withImage?: boolean } = {}) => {
  const {
    blocks: { BaseTeaser },
    ContentWrapper,
  } = useWebsiteBuilder();
  return (
    <>
      <ContentWrapper data-testid="content">
        <BaseTeaser
          teaser={mockCustomTeaser({
            title: 'Brand title',
            preTitle: 'Brand kicker',
            image: withImage ? mockImage({ description: 'Brand image' }) : null,
          })}
          alignment={mockFlexAlignment({ x: 0, y: 0, w: 3, h: 4 })}
          index={0}
          blockStyle={null}
        />
        <Typography variant="caption">Brand caption</Typography>
        <Button variant="contained">Primary action</Button>
        <Button
          variant="contained"
          color="secondary"
        >
          Secondary action
        </Button>
        <Button
          variant="outlined"
          color="secondary"
        >
          Outlined action
        </Button>
      </ContentWrapper>
      <CourantFooter
        data={{ __typename: 'Query', navigations: mockNavigations() }}
        loading={false}
        slug="main"
        categorySlugs={[['categories', 'about']]}
        iconSlug="icons"
        wepublishLogo="light"
      />
    </>
  );
};

const renderBrand = (
  overrides: CourantColorOverrides = {},
  {
    withImage = false,
    settingsTheme,
  }: { withImage?: boolean; settingsTheme?: ThemeOptions } = {}
) =>
  renderWithProviders(<BrandPage withImage={withImage} />, {
    tenant: {
      ...courantConfig,
      createTheme: () => createCourantTheme(settingsTheme, overrides),
    },
  });

describe('rendered Courant brand styles', () => {
  it.each([375, 900, 1440])(
    'keeps typography and layout brand-owned at %ipx',
    width => {
      setTestViewportWidth(width);
      renderBrand();
      const title = getComputedStyle(
        screen.getByRole('heading', { name: 'Brand title' })
      );
      const kicker = getComputedStyle(screen.getByText('Brand kicker'));
      const caption = getComputedStyle(screen.getByText('Brand caption'));
      const button = getComputedStyle(
        screen.getByRole('button', { name: 'Primary action' })
      );
      expect(title.fontFamily).toBe('local, serif');
      expect(title.fontWeight).toBe('500');
      expect(title.fontSize).toBe('26px');
      expect(kicker.fontFamily).toBe('local, sans-serif');
      expect(kicker.fontWeight).toBe('400');
      expect(kicker.fontSize).toBe('12.8px');
      expect(kicker.padding).toBe('0px');
      expect(caption.fontFamily).toBe('local, sans-serif');
      expect(caption.lineHeight).toBe('1.4');
      expect(button.lineHeight).toBe('1.2');
      expect(button.fontWeight).toBe('700');
      expect(getComputedStyle(screen.getByTestId('content')).rowGap).toBe(
        width >= 1333 ? '80px'
        : width >= 900 ? '64px'
        : '48px'
      );
    }
  );

  it('uses resolved palette colors for buttons and the footer logo while keeping labels transparent', () => {
    setTestViewportWidth(1440);
    renderBrand({
      palette: {
        primary: { main: '#123456' },
        accent: { main: '#eeeeee' },
        common: { white: '#fafafa', black: '#111111' },
      },
    });
    const primary = getComputedStyle(
      screen.getByRole('button', { name: 'Primary action' })
    );
    const secondary = getComputedStyle(
      screen.getByRole('button', { name: 'Secondary action' })
    );
    const outlined = getComputedStyle(
      screen.getByRole('button', { name: 'Outlined action' })
    );
    expect(primary.backgroundColor).toBe('#123456');
    expect(secondary.backgroundColor).toBe('#fafafa');
    expect(secondary.color).toBe('#111111');
    expect(outlined.color).toBe('#fafafa');
    expect(outlined.borderWidth).toBe('1px');
    expect(
      getComputedStyle(screen.getByRole('img', { name: 'Courant' })).color
    ).toBe('#fafafa');
    expect(
      getComputedStyle(screen.getByText('Brand kicker')).backgroundColor
    ).toBe('transparent');
  });

  it('keeps the teaser pre-title above the title and off the image', () => {
    setTestViewportWidth(1440);
    renderBrand();
    const preTitle = getComputedStyle(screen.getByText('Brand kicker'));
    expect(preTitle.transform).toBe('none');
  });

  it('renders teaser thumbnails at a 16/9 aspect ratio', () => {
    setTestViewportWidth(1440);
    renderBrand({}, { withImage: true });
    const image = screen.getByRole('img', { name: 'Brand image' });
    expect(getComputedStyle(image).aspectRatio).toBe('16 / 9');
  });

  it('applies the label text color but keeps its background transparent', () => {
    renderBrand({
      teaserLabel: { color: '#ffffff', backgroundColor: '#123456' },
    });
    const label = getComputedStyle(screen.getByText('Brand kicker'));
    expect(label.color).toBe('#ffffff');
    expect(label.backgroundColor).toBe('transparent');
  });

  it('preserves the tenant button padding when CMS component styles are supplied', () => {
    renderBrand(
      {},
      {
        settingsTheme: {
          components: {
            MuiButton: { styleOverrides: { root: { padding: '99px' } } },
          },
        } as unknown as ThemeOptions,
      }
    );
    const button = getComputedStyle(
      screen.getByRole('button', { name: 'Primary action' })
    );
    expect(button.padding).toBe('8px 16px');
  });

  it('honors UI role colors on buttons as well as typography', () => {
    renderBrand({
      typography: { ui: { color: '#ffffff', backgroundColor: '#123456' } },
    });
    for (const name of ['Primary action', 'Secondary action']) {
      const style = getComputedStyle(screen.getByRole('button', { name }));
      expect(style.color).toBe('#ffffff');
      expect(style.backgroundColor).toBe('#123456');
    }
  });
});
