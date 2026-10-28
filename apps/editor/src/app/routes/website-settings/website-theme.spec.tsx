import '@testing-library/jest-dom/vitest';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { mediaQuery } from './theme/typography-breakpoints';
import { WebsiteTheme } from './website-theme';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseLazyQuery = useLazyQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const theme = createTheme({ cssVariables: true });

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <WebsiteTheme />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  mockedUseLazyQuery.mockReset();
  mockedUseLazyQuery.mockReturnValue([
    vi.fn().mockResolvedValue({
      data: { websiteSettings: { theme: {}, fonts: [] } },
    }),
    { data: { websiteSettings: { theme: {}, fonts: [] } }, loading: false },
  ]);
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
});

describe('WebsiteTheme', () => {
  it('loads and saves per-breakpoint typography as media queries of the theme', async () => {
    const md = '@media (min-width:900px)';
    const stored = {
      typography: { h1: { fontSize: '2rem', [md]: { fontSize: '3rem' } } },
    };
    const updateWebsiteSettings = vi.fn();

    mockedUseLazyQuery.mockReturnValue([
      vi.fn().mockResolvedValue({
        data: { websiteSettings: { theme: stored, fonts: [] } },
      }),
      {
        data: { websiteSettings: { theme: stored, fonts: [] } },
        loading: false,
      },
    ]);
    mockedUseMutation.mockReturnValue([
      updateWebsiteSettings,
      { loading: false },
    ]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'save' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(updateWebsiteSettings).toHaveBeenCalled());

    const { h1 } =
      updateWebsiteSettings.mock.calls[0][0].variables.theme.typography;

    expect(h1).toMatchObject({ fontSize: '2rem', [md]: { fontSize: '3rem' } });
    expect(h1).not.toHaveProperty('breakpoints');
  });

  it('saves the typography of the form unchanged, media queries smallest first', async () => {
    const md = mediaQuery('md');
    const lg = mediaQuery('lg');
    const stored = {
      typography: {
        h2: {
          [lg]: { fontSize: '4rem' },
          fontSize: '2rem',
          [md]: { fontSize: null },
        },
      },
    };
    const updateWebsiteSettings = vi.fn();

    mockedUseLazyQuery.mockReturnValue([
      vi.fn().mockResolvedValue({
        data: { websiteSettings: { theme: stored, fonts: [] } },
      }),
      {
        data: { websiteSettings: { theme: stored, fonts: [] } },
        loading: false,
      },
    ]);
    mockedUseMutation.mockReturnValue([
      updateWebsiteSettings,
      { loading: false },
    ]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'save' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(updateWebsiteSettings).toHaveBeenCalled());

    const { h2 } =
      updateWebsiteSettings.mock.calls[0][0].variables.theme.typography;
    const keys = Object.keys(h2);
    const mediaKeys = keys.filter(key => key.startsWith('@media'));

    expect(h2).toMatchObject({
      fontSize: '2rem',
      [md]: { fontSize: null },
      [lg]: { fontSize: '4rem' },
    });
    expect(h2).not.toHaveProperty('breakpoints');
    expect(mediaKeys).toEqual([md, lg]);
    expect(keys.slice(-mediaKeys.length)).toEqual(mediaKeys);
  });

  it('says which settings page this is', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'websiteSettings.theme.title' })
    ).toBeInTheDocument();
  });

  it('keeps saving, exporting and importing together in the header', () => {
    renderPage();

    const header = screen
      .getByRole('heading', { name: 'websiteSettings.theme.title' })
      .closest('header') as HTMLElement;

    expect(
      within(header).getByRole('link', { name: /backToOverview/ })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'save' })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', {
        name: 'websiteSettings.theme.exportTheme',
      })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', {
        name: 'websiteSettings.theme.importTheme',
      })
    ).toBeInTheDocument();
  });
});

const stubMediaQueries = ({
  wide,
  reducedMotion = false,
}: {
  wide: boolean;
  reducedMotion?: boolean;
}) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query.includes('min-width:1200px') ? wide
        : query.includes('prefers-reduced-motion: reduce') ? reducedMotion
        : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

const openTypographyTab = () =>
  fireEvent.click(
    screen.getByRole('tab', { name: 'websiteSettings.theme.typographyTab' })
  );

describe('WebsiteTheme layout', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the palette tab at 500px', () => {
    renderPage();

    expect(screen.getByRole('tabpanel')).toHaveStyle({ maxWidth: '500px' });
  });

  it('lets the typography tab use the full width', () => {
    renderPage();
    openTypographyTab();

    expect(screen.getByRole('tabpanel')).not.toHaveStyle({ maxWidth: '500px' });
  });

  it('shows no separate preview on narrow screens', () => {
    stubMediaQueries({ wide: false });
    renderPage();
    openTypographyTab();

    expect(
      screen.queryByRole('complementary', {
        name: 'websiteSettings.theme.typography.preview',
      })
    ).not.toBeInTheDocument();
  });

  it('opens a style from the preview on wide screens and moves focus to it', async () => {
    stubMediaQueries({ wide: true });
    renderPage();
    openTypographyTab();

    const preview = screen.getByRole('complementary', {
      name: 'websiteSettings.theme.typography.preview',
    });

    fireEvent.click(
      within(preview).getByRole('button', {
        name: 'websiteSettings.theme.typography.h3',
      })
    );

    const header = screen.getByRole('button', {
      name: /typography\.h3/,
      expanded: true,
    });

    await waitFor(() => expect(header).toHaveFocus());
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    );

    fireEvent.click(
      within(preview).getByRole('button', {
        name: 'websiteSettings.theme.typography.h3',
      })
    );

    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('scrolls to a style from the preview only after the rows stopped moving', async () => {
    stubMediaQueries({ wide: true });
    renderPage();
    openTypographyTab();

    fireEvent.click(
      screen.getByRole('button', { name: /typography\.h1/, expanded: false })
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /typography\.h1/, expanded: true })
      ).toBeInTheDocument()
    );

    const preview = screen.getByRole('complementary', {
      name: 'websiteSettings.theme.typography.preview',
    });

    fireEvent.click(
      within(preview).getByRole('button', {
        name: 'websiteSettings.theme.typography.blockQuote',
      })
    );

    const header = screen.getByRole('button', {
      name: /typography\.blockQuote/,
      expanded: true,
    });

    expect(header).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(header);
  });

  it('marks the open style in the preview', () => {
    stubMediaQueries({ wide: true });
    renderPage();
    openTypographyTab();

    const preview = screen.getByRole('complementary', {
      name: 'websiteSettings.theme.typography.preview',
    });

    fireEvent.click(
      screen.getByRole('button', { name: /typography\.h2/, expanded: false })
    );

    expect(
      within(preview).getByRole('button', {
        name: 'websiteSettings.theme.typography.h2',
      })
    ).toHaveAttribute('aria-current', 'true');
    expect(
      within(preview).getByRole('button', {
        name: 'websiteSettings.theme.typography.h1',
      })
    ).not.toHaveAttribute('aria-current');
  });

  it('jumps without animation when reduced motion is preferred', async () => {
    stubMediaQueries({ wide: true, reducedMotion: true });
    renderPage();
    openTypographyTab();

    fireEvent.click(
      within(
        screen.getByRole('complementary', {
          name: 'websiteSettings.theme.typography.preview',
        })
      ).getByRole('button', { name: 'websiteSettings.theme.typography.body1' })
    );

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'auto' })
      )
    );
  });
});
