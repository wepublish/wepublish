import type { Mock } from 'vitest';
import type { ComponentType } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  NewsletterListLockedDisplay,
  useDeleteNewsletterListMutation,
  useNewsletterListsQuery,
} from '@wepublish/editor/api';
import { NewsletterListOverview } from './newsletter-list-overview';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useNewsletterListsQuery: vi.fn(),
  useDeleteNewsletterListMutation: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent:
    () =>
    <P extends object>(Component: ComponentType<P>) =>
      Component,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const list = {
  id: 'list-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Morning Briefing',
  slug: 'morning-briefing',
  description: null,
  active: true,
  requiresSubscription: true,
  anyMemberPlan: false,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.Teaser,
  lockedText: null,
  lockedLinkUrl: null,
  memberPlans: [{ id: 'plan-a', name: 'Plan A' }],
};

const deleteNewsletterList = vi.fn();

beforeEach(() => {
  deleteNewsletterList.mockReset();
  (useNewsletterListsQuery as Mock).mockReturnValue({
    data: { newsletterLists: [list] },
    loading: false,
    refetch: vi.fn(),
  });
  (useDeleteNewsletterListMutation as Mock).mockReturnValue([
    deleteNewsletterList,
    { loading: false },
  ]);
});

const renderOverview = () =>
  render(
    <MemoryRouter>
      <NewsletterListOverview />
    </MemoryRouter>
  );

describe('NewsletterListOverview', () => {
  it('links each list to its edit page', () => {
    renderOverview();

    expect(
      screen.getByText('Morning Briefing').closest('a')?.getAttribute('href')
    ).toBe('/edit/list-1');
    expect(
      screen.getByText('newsletter.overview.subscribersOnly')
    ).toBeTruthy();
  });

  it('asks for confirmation before deleting a list', () => {
    renderOverview();

    fireEvent.click(screen.getByLabelText('delete'));

    expect(deleteNewsletterList).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'newsletter.overview.deleteBody {"list":"Morning Briefing"}'
      )
    ).toBeTruthy();

    fireEvent.click(screen.getByText('newsletter.overview.deleteConfirm'));

    expect(deleteNewsletterList).toHaveBeenCalledWith({
      variables: { id: 'list-1' },
    });
  });
});
