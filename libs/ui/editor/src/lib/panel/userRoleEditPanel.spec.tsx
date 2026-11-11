import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { UserRoleEditPanel } from './userRoleEditPanel';

const permissions = [
  { id: 'p1', description: 'Allows to get articles', deprecated: false },
  { id: 'p2', description: 'Allows to create articles', deprecated: false },
];

let userRole = {
  id: 'role',
  name: 'Admin',
  description: '',
  systemRole: true,
  permissions,
};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: { permissions }, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: { userRole } }) }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../atoms', async importOriginal => ({
  ...(await importOriginal<typeof import('../atoms')>()),
  useAuthorisation: () => true,
}));

const renderPanel = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <UserRoleEditPanel id="role" />
    </ThemeProvider>
  );

describe('UserRoleEditPanel', () => {
  beforeEach(() => {
    userRole = { ...userRole, systemRole: true };
  });

  it('marks the name as required without native validation', async () => {
    renderPanel();

    const name = await screen.findByRole('textbox', {
      name: 'userRoles.panels.name',
    });

    expect(name).toBeRequired();
    expect(name.closest('form')).toHaveAttribute('novalidate');
  });

  it('does not expose the permissions of a system role as buttons', async () => {
    renderPanel();

    expect(
      await screen.findByText('Allows to get articles')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Allows to get articles' })
    ).not.toBeInTheDocument();
  });

  it('lets the keyboard reach the read-only permissions of a system role', async () => {
    renderPanel();

    const region = await screen.findByRole('region', {
      name: 'userRoles.panels.editUserRole',
    });

    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('keeps an editable role free of an extra tab stop', async () => {
    userRole = { ...userRole, systemRole: false };
    renderPanel();

    expect(
      await screen.findByRole('button', { name: 'Allows to get articles' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
