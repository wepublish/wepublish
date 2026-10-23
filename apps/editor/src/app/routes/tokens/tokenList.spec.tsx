import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  TokenListDocument,
  UpdateTokenDocument,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { TokenList } from './tokenList';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as Mock;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false, error: undefined },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  // The permission wrappers would otherwise need an authenticated session.
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: React.ReactNode }) => children,
  useAuthorisation: () => true,
  TokenGeneratePanel: () => null,
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;
const updateToken = mutationFor(UpdateTokenDocument);

const roles = [
  {
    id: 'role-1',
    name: 'print-export',
    description: null,
    systemRole: false,
    permissions: [],
  },
  {
    id: 'peer',
    name: 'Peer',
    description: null,
    systemRole: true,
    permissions: [],
  },
];

const tokens = [
  { id: 'token-1', name: 'nw-one-click-export', roleIDs: ['role-1'] },
  { id: 'token-2', name: 'old-peer', roleIDs: [] },
];

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation((document: unknown) => {
    if (document === TokenListDocument) {
      return { data: { tokens }, loading: false };
    }

    if (document === UserRoleListDocument) {
      return { data: { userRoles: { nodes: roles } }, loading: false };
    }

    return { data: undefined, loading: false };
  });
  updateToken.mockReset();
  updateToken.mockResolvedValue({ data: undefined });
});

const renderList = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={['/tokens']}>
        <TokenList />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('TokenList', () => {
  it('shows the roles of every token, and says so when a token has none', () => {
    renderList();

    expect(screen.getByText('print-export')).toBeTruthy();
    expect(screen.getByText('tokenList.panels.noRoles')).toBeTruthy();
  });

  it('replaces the roles of a token', async () => {
    renderList();

    fireEvent.click(screen.getAllByLabelText('tokenList.panels.editRoles')[1]!);
    const dialog = await screen.findByRole('dialog');

    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    fireEvent.click(await screen.findByText('Peer'));
    fireEvent.click(within(dialog).getByText('save'));

    await waitFor(() =>
      expect(updateToken).toHaveBeenCalledWith({
        variables: { id: 'token-2', roleIDs: ['peer'] },
      })
    );
  });
});
