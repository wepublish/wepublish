import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CreateTokenDocument,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { TokenGeneratePanel } from './tokenGeneratePanel';

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
    { data: undefined, loading: false, error: undefined },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../atoms/permissionControl', async importOriginal => ({
  ...(await importOriginal<typeof import('../atoms/permissionControl')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;
const createToken = mutationFor(CreateTokenDocument);

const roles = [
  {
    id: 'role-1',
    name: 'print-export',
    description: null,
    systemRole: false,
    permissions: [],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: null,
    systemRole: true,
    permissions: [],
  },
];

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation((document: unknown) =>
    document === UserRoleListDocument ?
      { data: { userRoles: { nodes: roles } }, loading: false }
    : { data: undefined, loading: false }
  );
  createToken.mockReset();
  createToken.mockResolvedValue({ data: undefined });
});

const typeName = (name: string) =>
  fireEvent.change(screen.getByPlaceholderText('tokenList.panels.name'), {
    target: { value: name },
  });

describe('TokenGeneratePanel', () => {
  it('creates the token with the roles that were picked', async () => {
    render(<TokenGeneratePanel />);
    typeName('export');

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('print-export'));
    fireEvent.click(screen.getByText('tokenList.panels.generate'));

    await waitFor(() =>
      expect(createToken).toHaveBeenCalledWith({
        variables: { name: 'export', roleIDs: ['role-1'] },
      })
    );
  });

  it('warns that a token without roles may do nothing, and still creates it', async () => {
    render(<TokenGeneratePanel />);
    typeName('peer');

    expect(screen.getByText('tokenList.panels.noRolesWarning')).toBeTruthy();

    fireEvent.click(screen.getByText('tokenList.panels.generate'));

    await waitFor(() =>
      expect(createToken).toHaveBeenCalledWith({
        variables: { name: 'peer', roleIDs: [] },
      })
    );
  });
});
