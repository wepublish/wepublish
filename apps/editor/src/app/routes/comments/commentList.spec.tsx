import '@testing-library/jest-dom/vitest';

import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { CommentSort, CommentState, SortOrder } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { CommentList } from './commentList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ?
        `${key}:${Object.values(options)
          .map(value =>
            value instanceof Date ? value.toISOString() : String(value)
          )
          .join(',')}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const comment = {
  id: 'comment-1',
  itemID: 'article-1',
  itemType: 'Article',
  parentComment: null,
  state: CommentState.Approved,
  rejectionReason: null,
  guestUsername: 'Anonymous',
  user: { id: 'user-1', name: 'Grace Hopper' },
  tags: [],
  source: null,
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  revisions: [
    {
      text: {
        content: [
          { type: 'paragraph', children: [{ text: 'A thoughtful remark' }] },
        ],
      },
      title: null,
      lead: null,
      createdAt: '2026-01-02T10:00:00.000Z',
    },
  ],
};

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <CommentList />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      comments: {
        nodes: [comment],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /filterableList.filter.label/ })
  );

describe('CommentList', () => {
  it('shows comments in every state by default', () => {
    renderList();

    expect(lastVariables()?.filter?.states).toEqual(
      expect.arrayContaining([
        CommentState.Approved,
        CommentState.PendingApproval,
        CommentState.PendingUserChanges,
        CommentState.Rejected,
      ])
    );
  });

  it('keeps the state filter behind the toolbar button', () => {
    renderList();

    expect(
      screen.queryByRole('combobox', { name: 'comments.overview.states' })
    ).not.toBeInTheDocument();

    openFilters();

    expect(
      screen.getByRole('combobox', { name: 'comments.overview.states' })
    ).toBeInTheDocument();
  });

  it('counts no filter while every state is shown', () => {
    renderList();

    expect(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    ).not.toHaveTextContent('1');
    expect(
      screen.queryByRole('button', { name: 'filterableList.filter.reset' })
    ).not.toBeInTheDocument();
  });

  it('shows the comment text as plain text', async () => {
    renderList();

    expect(await screen.findByText('A thoughtful remark')).toBeTruthy();
  });

  it('credits the signed-in user rather than the guest name', async () => {
    renderList();

    expect(await screen.findByText('Grace Hopper')).toBeTruthy();
    expect(screen.queryByText('Anonymous')).toBeNull();
  });

  it('falls back to the guest name when there is no user', async () => {
    mockedUseQuery.mockReturnValue({
      data: {
        comments: {
          nodes: [{ ...comment, user: null }],
          totalCount: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
      loading: false,
      refetch: vi.fn(),
    });
    renderList();

    expect(await screen.findByText('Anonymous')).toBeTruthy();
  });

  it('shows when the comment was last edited', async () => {
    renderList();

    expect(
      await screen.findByText(
        'comments.overview.modifiedAtDate:2026-09-28T15:30:00.000Z'
      )
    ).toBeTruthy();
  });

  it('sorts by the last edit when the user clicks that column', async () => {
    renderList();

    fireEvent.click(await screen.findByText('comments.overview.updated'));

    expect(lastVariables()).toEqual(
      expect.objectContaining({
        sort: CommentSort.ModifiedAt,
        order: SortOrder.Ascending,
      })
    );
  });

  it('links to the comment editor', async () => {
    renderList();

    expect(
      await screen.findByRole('link', { name: 'comments.overview.edit' })
    ).toHaveAttribute('href', '/edit/comment-1');
  });

  it('drops the approved state from the filter when it is deselected', () => {
    renderList();
    openFilters();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'comments.overview.states' })
    );
    fireEvent.click(
      within(screen.getByRole('listbox')).getByText('comments.state.approved')
    );

    expect(lastVariables()?.filter?.states).not.toContain(
      CommentState.Approved
    );
  });

  it('keeps the other states in the filter when one is deselected', () => {
    renderList();
    openFilters();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'comments.overview.states' })
    );
    fireEvent.click(
      within(screen.getByRole('listbox')).getByText('comments.state.rejected')
    );

    expect(lastVariables()?.filter?.states).toEqual([
      CommentState.Approved,
      CommentState.PendingApproval,
      CommentState.PendingUserChanges,
    ]);
  });
});
