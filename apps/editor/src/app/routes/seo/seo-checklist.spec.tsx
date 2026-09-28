import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import {
  SeoCheck,
  SeoCheckId,
  SeoCheckKind,
  SeoCheckStatus,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import { groupSeoChecks, SeoChecklist } from './seo-checklist';

const { queryResult } = vi.hoisted(() => ({
  queryResult: {
    data: undefined as unknown,
    loading: false,
    error: undefined as Error | undefined,
    refetch: vi.fn(),
  },
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useSeoChecklistQuery: () => queryResult,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
    i18n: { language: 'en' },
  }),
}));

const check = (
  id: SeoCheckId,
  kind: SeoCheckKind,
  status: SeoCheckStatus,
  extra: Partial<SeoCheck> = {}
): SeoCheck => ({ id, kind, status, ...extra });

const checks = [
  check(SeoCheckId.Robots, SeoCheckKind.Verifiable, SeoCheckStatus.Ok),
  check(
    SeoCheckId.RobotsSitemap,
    SeoCheckKind.Verifiable,
    SeoCheckStatus.Warning,
    { detail: 'https://wepublish.ch/api/sitemap' }
  ),
  check(SeoCheckId.Sitemap, SeoCheckKind.Verifiable, SeoCheckStatus.Ok, {
    detail: '42',
    url: 'https://example.com/api/sitemap',
  }),
  check(SeoCheckId.Canonical, SeoCheckKind.Automatic, SeoCheckStatus.Ok),
  check(SeoCheckId.SearchConsole, SeoCheckKind.Manual, SeoCheckStatus.Info, {
    url: 'https://example.com/api/sitemap',
  }),
];

const renderChecklist = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <SeoChecklist />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('SeoChecklist', () => {
  beforeEach(() => {
    queryResult.loading = false;
    queryResult.error = undefined;
    queryResult.data = {
      seoChecklist: {
        websiteUrl: 'https://example.com',
        sitemapUrl: 'https://example.com/api/sitemap',
        robotsUrl: 'https://example.com/robots.txt',
        checks,
      },
    };
  });

  test('renders each check with its status', () => {
    renderChecklist();

    expect(
      screen.getByTestId('seo-check-RobotsSitemap').getAttribute('data-status')
    ).toBe(SeoCheckStatus.Warning);
    expect(
      within(screen.getByTestId('seo-check-RobotsSitemap')).getByText(
        'https://wepublish.ch/api/sitemap'
      )
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('seo-check-Sitemap')).getByText(
        'seoChecklist.checks.Sitemap.Ok'
      )
    ).toBeTruthy();
  });

  test('shows the manual steps first', () => {
    renderChecklist();

    const headings = screen
      .getAllByText(/^seoChecklist\.kinds\..*\.title$/)
      .map(element => element.textContent);

    expect(headings).toEqual([
      'seoChecklist.kinds.Manual.title',
      'seoChecklist.kinds.Verifiable.title',
      'seoChecklist.kinds.Automatic.title',
    ]);
  });

  test('links to Search Console and the sitemap', () => {
    renderChecklist();

    const searchConsole = within(screen.getByTestId('seo-check-SearchConsole'));

    expect(
      searchConsole
        .getByText('seoChecklist.checks.SearchConsole.action')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('https://search.google.com/search-console');
    expect(
      searchConsole.getByText('https://example.com/api/sitemap')
    ).toBeTruthy();
  });

  test('shows errors', () => {
    queryResult.data = undefined;
    queryResult.error = new Error('Forbidden');

    renderChecklist();

    expect(screen.getByText('Forbidden')).toBeTruthy();
  });
});

describe('groupSeoChecks', () => {
  test('groups by kind and omits empty groups', () => {
    expect(
      groupSeoChecks(checks.filter(c => c.kind !== SeoCheckKind.Automatic)).map(
        group => [group.kind, group.checks.map(c => c.id)]
      )
    ).toEqual([
      [SeoCheckKind.Manual, [SeoCheckId.SearchConsole]],
      [
        SeoCheckKind.Verifiable,
        [SeoCheckId.Robots, SeoCheckId.RobotsSitemap, SeoCheckId.Sitemap],
      ],
    ]);
  });
});
