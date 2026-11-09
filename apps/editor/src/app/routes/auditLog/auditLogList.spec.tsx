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
  it('labels the free-text filters', () => {
    renderList();

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
