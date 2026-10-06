import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ActivityFeed } from './activityFeed';

const actions = Array.from({ length: 15 }, (_, index) => ({
  __typename: 'ArticleCreatedAction',
  date: '2026-10-01T10:00:00.000Z',
  article: {
    id: `article-${index}`,
    latest: { title: `Artikel ${index + 1}`, socialMediaTitle: null },
  },
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useRecentActionsQuery: () => ({ data: { actions }, error: undefined }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'count' in opts ? `${key}:${opts.count}` : key,
    i18n: { language: 'de' },
  }),
  Trans: ({ i18nKey }: { i18nKey?: string }) => <>{i18nKey}</>,
}));

const renderFeed = () =>
  render(
    <MemoryRouter>
      <ActivityFeed />
    </MemoryRouter>
  );

describe('ActivityFeed', () => {
  it('shows only the latest entries at first', () => {
    renderFeed();

    expect(screen.getByText('Artikel 3')).not.toBeNull();
    expect(screen.queryByText('Artikel 4')).toBeNull();
    expect(screen.getByText('dashboard.showMore:12')).not.toBeNull();
  });

  it('reveals the remaining entries and can collapse again', () => {
    renderFeed();

    fireEvent.click(screen.getByText('dashboard.showMore:12'));

    expect(screen.getByText('Artikel 15')).not.toBeNull();

    fireEvent.click(screen.getByText('dashboard.showLess'));

    expect(screen.queryByText('Artikel 15')).toBeNull();
  });
});
