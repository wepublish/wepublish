import type { Mock } from 'vitest';
import type { ComponentType } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  NewsletterListLockedDisplay,
  useNewsletterListQuery,
  useUpdateNewsletterListMutation,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { NewsletterListEditView } from './newsletter-list-edit-view';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useNewsletterListQuery: vi.fn(),
  useUpdateNewsletterListMutation: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent:
    () =>
    <P extends object>(Component: ComponentType<P>) =>
      Component,
  useAuthorisation: vi.fn(),
  SelectMemberPlans: () => <div data-testid="select-member-plans" />,
}));

vi.mock('./newsletter-list-backfill', () => ({
  NewsletterListBackfill: () => <div>backfill</div>,
}));

vi.mock('./newsletter-subscriber-list', () => ({
  NewsletterSubscriberList: ({ listId }: { listId: string }) => (
    <div>subscribers of {listId}</div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
  anyMemberPlan: true,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.Teaser,
  lockedText: null,
  lockedLinkUrl: null,
  memberPlans: [],
};

beforeEach(() => {
  (useNewsletterListQuery as Mock).mockImplementation(({ onCompleted }) => {
    const completed = useRef(false);

    useEffect(() => {
      if (!completed.current) {
        completed.current = true;
        onCompleted?.({ newsletterList: list });
      }
    }, [onCompleted]);

    return { loading: false };
  });
  (useUpdateNewsletterListMutation as Mock).mockReturnValue([
    vi.fn(),
    { loading: false },
  ]);
});

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={['/newsletters/edit/list-1']}>
        <Routes>
          <Route
            path="/newsletters/edit/:id"
            element={<NewsletterListEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('NewsletterListEditView', () => {
  it('shows the subscribers of the list in their own tab', () => {
    (useAuthorisation as Mock).mockReturnValue(true);
    renderView();

    expect(screen.queryByText('subscribers of list-1')).toBeNull();

    fireEvent.click(screen.getByText('newsletter.tabs.subscribers'));

    expect(screen.getByText('subscribers of list-1')).toBeTruthy();
  });

  it('hides the subscribers tab without the permission', () => {
    (useAuthorisation as Mock).mockReturnValue(false);
    renderView();

    expect(screen.queryByText('newsletter.tabs.subscribers')).toBeNull();
    expect(screen.queryByText('newsletter.backfill.title')).toBeNull();
  });
});
