import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuditLogAction, AuditLogActorType } from '@wepublish/editor/api';
import { CanGetAuditLogs } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { AuditLogList } from './auditLogList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const entry = {
  __typename: 'AuditLog',
  id: 'log-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  actorType: AuditLogActorType.User,
  userEmail: 'ada@example.test',
  tokenName: null,
  impersonatedBy: null,
  action: AuditLogAction.Update,
  mutation: 'updateArticle',
  entity: 'Article',
  recordId: 'article-1',
  sessionId: '650e03f6-1111-2222-3333-444455556666',
  success: true,
  errorMessage: null,
};

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                { id: 'role', permissions: [{ id: CanGetAuditLogs.id }] },
              ],
            },
          } as never
        }
      >
        <MemoryRouter>
          <AuditLogList />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

const lastFilter = () =>
  mockedUseQuery.mock.calls.at(-1)?.[1]?.variables?.filter;

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      auditLogs: { supported: true, nodes: [entry], totalCount: 1 },
    },
    loading: false,
  });
});

describe('AuditLogList', () => {
  const showing = (over: Partial<typeof entry>) =>
    mockedUseQuery.mockReturnValue({
      data: {
        auditLogs: {
          supported: true,
          nodes: [{ ...entry, ...over }],
          totalCount: 1,
        },
      },
      loading: false,
    });

  it('names the api key and the person it acted for', () => {
    showing({
      actorType: AuditLogActorType.Token,
      tokenName: 'e2e',
      userEmail: 'dev@example.test',
    });
    renderList();

    expect(
      screen.getByText('auditLogList.overview.tokenActorOnBehalf')
    ).toBeTruthy();
    expect(screen.queryByText('auditLogList.overview.tokenActor')).toBeNull();
  });

  it('names only the token when nobody stands behind it, as for a peering token', () => {
    showing({
      actorType: AuditLogActorType.Token,
      tokenName: 'Peer',
      userEmail: null,
    });
    renderList();

    expect(screen.getByText('auditLogList.overview.tokenActor')).toBeTruthy();
  });

  const openFilters = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );

  it('keeps the filters folded away behind the filter button, like the other lists', () => {
    renderList();

    expect(
      screen.queryByRole('textbox', { name: 'auditLogList.filter.entity' })
    ).toBeNull();

    openFilters();

    expect(
      screen.getByRole('textbox', { name: 'auditLogList.filter.entity' })
    ).toBeInTheDocument();
  });

  it('starts on a page size the page size picker offers', () => {
    renderList();

    const variables = mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;
    expect(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' })
    ).toHaveValue(String(variables.take));
  });

  it('remembers filters and page size for the next visit', () => {
    const { unmount } = renderList();

    openFilters();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'auditLogList.filter.entity' }),
      { target: { value: 'Article' } }
    );
    fireEvent.change(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' }),
      { target: { value: '50' } }
    );
    unmount();

    mockedUseQuery.mockClear();
    renderList();

    const variables = mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;
    expect(variables.filter).toMatchObject({ entity: 'Article' });
    expect(variables.take).toBe(50);
  });

  it('shows a remembered search and keeps it', async () => {
    localStorage.setItem(
      'wepublish:editor:listState:audit-log',
      JSON.stringify({
        filter: { search: 'ada' },
        sortField: 'createdAt',
        sortOrder: 'desc',
        limit: 25,
      })
    );

    renderList();
    openFilters();

    expect(
      screen.getByRole('textbox', {
        name: 'auditLogList.filter.searchPlaceholder',
      })
    ).toHaveValue('ada');

    // past the search debounce
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(lastFilter()).toMatchObject({ search: 'ada' });
  });

  it('counts the active filters and resets them', () => {
    renderList();

    openFilters();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'auditLogList.filter.entity' }),
      { target: { value: 'Article' } }
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'auditLogList.filter.failuresOnly' })
    );

    expect(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    ).toHaveTextContent('2');

    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.reset' })
    );

    expect(lastFilter()?.entity).toBeUndefined();
    expect(lastFilter()?.success).toBeUndefined();
  });

  it('labels the free-text filters', () => {
    renderList();
    openFilters();

    expect(
      screen.getByRole('textbox', {
        name: 'auditLogList.filter.searchPlaceholder',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'auditLogList.filter.entity' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'auditLogList.filter.session' })
    ).toBeInTheDocument();
  });

  it('filters by a session with a real button named by its visible id', () => {
    renderList();

    const sessionButton = screen.getByRole('button', { name: /650e03f6/ });

    expect(sessionButton.tagName).toBe('BUTTON');
    expect(sessionButton).toHaveAccessibleDescription(
      'auditLogList.overview.filterBySession'
    );

    fireEvent.click(sessionButton);

    expect(lastFilter()).toMatchObject({ sessionId: entry.sessionId });
  });
});
