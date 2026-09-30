import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SeoCheckId, SeoCheckStatus } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import {
  getSeoChecklistProgress,
  isEntryDone,
  SEO_CHECKLIST,
  SeoChecklist,
} from './seoChecklist';

const { queryResult, updateItem, auth } = vi.hoisted(() => ({
  queryResult: {
    data: undefined as unknown,
    loading: false,
    error: undefined as Error | undefined,
    refetch: vi.fn(),
  },
  updateItem: vi.fn(),
  auth: { canUpdate: true },
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useSeoChecklistQuery: () => queryResult,
  useUpdateSeoChecklistItemMutation: () => [
    updateItem,
    { loading: false, error: undefined },
  ],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => auth.canUpdate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string | string[], options?: Record<string, unknown>) => {
      const resolved = Array.isArray(key) ? key[0] : key;

      return options && 'done' in options ?
          `${resolved}:${options['done']}/${options['total']}`
        : resolved;
    },
    i18n: { language: 'en' },
  }),
}));

const checks = [
  { id: SeoCheckId.Sitemap, status: SeoCheckStatus.Ok, detail: '42' },
  { id: SeoCheckId.NewsSitemap, status: SeoCheckStatus.Ok },
  {
    id: SeoCheckId.Feed,
    status: SeoCheckStatus.Warning,
    detail: 'HTTP 404',
  },
  { id: SeoCheckId.ArticleMarkup, status: SeoCheckStatus.Ok },
  {
    id: SeoCheckId.PublicationMetadata,
    status: SeoCheckStatus.Warning,
    detail: 'logo',
  },
];

const completedItems = [
  {
    itemId: 'gsc-verify',
    completedAt: '2026-09-28T10:00:00.000Z',
    completedBy: 'Ada Lovelace',
  },
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
    updateItem.mockReset();
    auth.canUpdate = true;
    queryResult.error = undefined;
    queryResult.loading = false;
    queryResult.data = {
      seoChecklist: {
        websiteUrl: 'https://example.com',
        sitemapUrl: 'https://example.com/api/sitemap',
        rssFeedUrl: 'https://example.com/api/rss-feed',
        atomFeedUrl: 'https://example.com/api/atom-feed',
        jsonFeedUrl: 'https://example.com/api/json-feed',
        checks,
        completedItems,
      },
    };
  });

  test('renders all sections', () => {
    renderChecklist();

    for (const section of SEO_CHECKLIST) {
      expect(screen.getByTestId(`seo-section-${section.id}`)).toBeTruthy();
    }
  });

  test('shows the saved progress of manual items', () => {
    renderChecklist();

    const verify = within(screen.getByTestId('seo-item-gsc-verify'));
    const sitemap = within(screen.getByTestId('seo-item-gsc-sitemap'));

    expect((verify.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      true
    );
    expect(verify.getByText('seoChecklist.completedBy')).toBeTruthy();
    expect((sitemap.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      false
    );
    expect(sitemap.getByText('https://example.com/api/sitemap')).toBeTruthy();
  });

  test('shows automatic checks as status instead of a checkbox', () => {
    renderChecklist();

    const feeds = within(screen.getByTestId('seo-item-feeds'));

    expect(feeds.queryByRole('checkbox')).toBe(null);
    expect(feeds.getByText('seoChecklist.checkStatus.Warning')).toBeTruthy();
    expect(feeds.getByText('HTTP 404')).toBeTruthy();
    expect(feeds.getByText('https://example.com/api/rss-feed')).toBeTruthy();
  });

  test('saves toggled items', () => {
    renderChecklist();

    fireEvent.click(
      within(screen.getByTestId('seo-item-gsc-sitemap')).getByRole('checkbox')
    );
    fireEvent.click(
      within(screen.getByTestId('seo-item-gsc-verify')).getByRole('checkbox')
    );

    expect(updateItem).toHaveBeenNthCalledWith(1, {
      variables: { itemId: 'gsc-sitemap', completed: true },
    });
    expect(updateItem).toHaveBeenNthCalledWith(2, {
      variables: { itemId: 'gsc-verify', completed: false },
    });
  });

  test('disables checkboxes without permission to update settings', () => {
    auth.canUpdate = false;

    renderChecklist();

    expect(
      (
        within(screen.getByTestId('seo-item-gsc-sitemap')).getByRole(
          'checkbox'
        ) as HTMLInputElement
      ).disabled
    ).toBe(true);
  });

  test('links to Search Console', () => {
    renderChecklist();

    expect(
      within(screen.getByTestId('seo-item-gsc-inspect'))
        .getByText('seoChecklist.items.gsc-inspect.action')
        .closest('a')
        ?.getAttribute('href')
    ).toBe('https://search.google.com/search-console');
  });

  test('shows errors', () => {
    queryResult.data = undefined;
    queryResult.error = new Error('Forbidden');

    renderChecklist();

    expect(screen.getByText('Forbidden')).toBeTruthy();
    expect(screen.queryByTestId('seo-checklist-placeholder')).toBe(null);
  });

  test('shows a greyed out placeholder while loading', () => {
    queryResult.data = undefined;
    queryResult.loading = true;

    renderChecklist();

    expect(screen.getByTestId('seo-checklist-placeholder')).toBeTruthy();

    for (const section of SEO_CHECKLIST) {
      expect(screen.getByTestId(`seo-section-${section.id}`)).toBeTruthy();
    }

    const verify = within(screen.getByTestId('seo-item-gsc-verify')).getByRole(
      'checkbox'
    ) as HTMLInputElement;

    expect(verify.disabled).toBe(true);
    expect(verify.checked).toBe(false);
    expect(
      within(screen.getByTestId('seo-item-feeds')).queryByRole('checkbox')
    ).toBe(null);
    expect(screen.queryByText(/^seoChecklist\.progress:/)).toBe(null);
  });

  test('shows a writing guide for SEO titles and meta descriptions', () => {
    renderChecklist();

    for (const id of ['seo-titles', 'meta-descriptions']) {
      const item = within(screen.getByTestId(`seo-item-${id}`));
      const toggle = item.getByRole('button', {
        name: 'seoChecklist.guide.show',
      });

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      expect(
        item.getAllByText(
          new RegExp(`^seoChecklist\\.items\\.${id}\\.guide\\.tips\\.`)
        ).length
      ).toBeGreaterThan(2);
      expect(
        item.getByText(`seoChecklist.items.${id}.guide.good`)
      ).toBeTruthy();
      expect(item.getByText(`seoChecklist.items.${id}.guide.bad`)).toBeTruthy();
    }

    expect(
      within(screen.getByTestId('seo-item-structure')).queryByRole('button', {
        name: 'seoChecklist.guide.show',
      })
    ).toBe(null);
  });
});

describe('getSeoChecklistProgress', () => {
  test('counts completed items, passing checks and info items', () => {
    const section = {
      id: 'test',
      items: [
        { id: 'manual-done' },
        { id: 'manual-open' },
        { id: 'check-ok', check: SeoCheckId.Sitemap },
        { id: 'check-warning', check: SeoCheckId.Feed },
        { id: 'info', info: true },
      ],
    };

    expect(
      getSeoChecklistProgress([section], checks, [{ itemId: 'manual-done' }])
    ).toEqual({ done: 3, total: 5 });
  });

  test('treats missing checks as not done', () => {
    expect(
      isEntryDone({ id: 'x', check: SeoCheckId.ArticleMarkup }, [], new Set())
    ).toBe(false);
  });

  test('uses unique item ids', () => {
    const ids = SEO_CHECKLIST.flatMap(section =>
      section.items.map(item => item.id)
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => /^[a-zA-Z0-9-]{1,64}$/.test(id))).toBe(true);
  });
});
