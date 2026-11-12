import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { startEditorImpersonation } from '../../impersonation';
import { startPreviewHandshake } from '../../openPreview';
import { ImpersonateUserPanel } from './impersonateUserPanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  CurrentSessionDocument: 'CurrentSession',
  ImpersonateUserDocument: 'ImpersonateUser',
  CreateWebsiteImpersonationDocument: 'CreateWebsiteImpersonation',
}));

vi.mock('../../impersonation', () => ({
  startEditorImpersonation: vi.fn(),
}));

vi.mock('../../openPreview', () => ({
  startPreviewHandshake: vi.fn(),
}));

const impersonateUser = vi.fn();
const createWebsiteImpersonation = vi.fn();

const editorUser = {
  id: 'user-2',
  email: 'editor@medium.ch',
  active: true,
  managedByWepublishLogin: false,
  roles: [{ permissions: [{ id: 'CAN_LOGIN_EDITOR' }] }],
};
const reader = { ...editorUser, email: 'reader@medium.ch', roles: [] };

const theme = createTheme({ cssVariables: true });

const renderPanel = (
  user: typeof editorUser,
  openWindow: () => Window | null = vi.fn()
) =>
  render(
    <ThemeProvider theme={theme}>
      <ImpersonateUserPanel
        user={user as never}
        openWindow={openWindow}
      />
    </ThemeProvider>
  );

const canImpersonate = (value: boolean) =>
  (useQuery as Mock).mockReturnValue({
    data: { currentSession: { canImpersonate: value } },
  });

const reason = (value: string) =>
  fireEvent.change(screen.getByLabelText('impersonation.reason'), {
    target: { value },
  });

beforeEach(() => {
  vi.clearAllMocks();
  canImpersonate(true);
  (useMutation as Mock).mockImplementation((document: string) => [
    document === 'ImpersonateUser' ? impersonateUser : (
      createWebsiteImpersonation
    ),
    { loading: false },
  ]);
  impersonateUser.mockResolvedValue({
    data: { impersonateUser: { token: 'user-token' } },
  });
  createWebsiteImpersonation.mockResolvedValue({
    data: {
      createWebsiteImpersonation: {
        token: 'grant-jwt',
        url: 'https://www.medium.ch',
      },
    },
  });
});

describe('ImpersonateUserPanel', () => {
  it('stays hidden for a session that may not impersonate', () => {
    canImpersonate(false);

    const { container } = renderPanel(editorUser);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['another We.Publish account', { managedByWepublishLogin: true }],
    ['an inactive user', { active: false }],
  ])('stays hidden for %s', (_, overrides) => {
    const { container } = renderPanel({ ...editorUser, ...overrides });

    expect(container).toBeEmptyDOMElement();
  });

  it('offers the editor only to someone who may use it', () => {
    renderPanel(reader);

    expect(
      screen.queryByRole('button', { name: 'impersonation.editor' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'impersonation.website' })
    ).toBeInTheDocument();
  });

  it('asks for a real reason before signing in as the user in the editor', async () => {
    renderPanel(editorUser);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.editor' })
    );

    const confirm = screen.getByRole('button', {
      name: 'impersonation.confirm',
    });
    reason(' x ');
    expect(confirm).toBeDisabled();

    reason('Ticket 4711');
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(startEditorImpersonation).toHaveBeenCalledWith('user-token')
    );
    expect(impersonateUser).toHaveBeenCalledWith({
      variables: { userId: 'user-2', reason: 'Ticket 4711' },
    });
  });

  it('signs in with Enter once the reason is real', async () => {
    renderPanel(editorUser);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.editor' })
    );

    await userEvent.type(
      screen.getByLabelText('impersonation.reason'),
      'Ticket 4711{enter}'
    );

    await waitFor(() =>
      expect(startEditorImpersonation).toHaveBeenCalledWith('user-token')
    );
  });

  it('ignores Enter while the reason is too short', async () => {
    renderPanel(editorUser);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.editor' })
    );

    await userEvent.type(
      screen.getByLabelText('impersonation.reason'),
      'x{enter}'
    );

    expect(impersonateUser).not.toHaveBeenCalled();
  });

  it('opens the website with Enter too', async () => {
    const website = { location: { href: '' }, close: vi.fn() };
    const openWindow = vi.fn(() => website as unknown as Window);

    renderPanel(reader, openWindow);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.website' })
    );
    await userEvent.type(
      screen.getByLabelText('impersonation.reason'),
      'Ticket 4711{enter}'
    );

    expect(openWindow).toHaveBeenCalled();
    await waitFor(() => expect(startPreviewHandshake).toHaveBeenCalled());
  });

  it('opens the website right away and hands it the grant', async () => {
    const website = { location: { href: '' }, close: vi.fn() };
    const openWindow = vi.fn(() => website as unknown as Window);

    renderPanel(reader, openWindow);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.website' })
    );
    reason('Ticket 4711');
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.confirm' })
    );

    expect(openWindow).toHaveBeenCalled();
    await waitFor(() =>
      expect(startPreviewHandshake).toHaveBeenCalledWith(
        website,
        'https://www.medium.ch',
        expect.objectContaining({ createToken: expect.any(Function) })
      )
    );
    expect(website.location.href).toBe('https://www.medium.ch');
    expect(createWebsiteImpersonation).toHaveBeenCalledWith({
      variables: { userId: 'user-2', reason: 'Ticket 4711' },
    });

    const [, , { createToken }] = (startPreviewHandshake as Mock).mock.calls[0];
    await expect(createToken()).resolves.toBe('grant-jwt');
  });

  it('says so when the browser blocks the website window', async () => {
    renderPanel(reader, () => null);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.website' })
    );
    reason('Ticket 4711');
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.confirm' })
    );

    expect(
      await screen.findByText('impersonation.popupBlocked')
    ).toBeInTheDocument();
    expect(createWebsiteImpersonation).not.toHaveBeenCalled();
  });

  it('closes the window and says so when the api refuses', async () => {
    const website = { location: { href: '' }, close: vi.fn() };
    createWebsiteImpersonation.mockRejectedValue(new Error('Forbidden'));

    renderPanel(reader, () => website as unknown as Window);
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.website' })
    );
    reason('Ticket 4711');
    fireEvent.click(
      screen.getByRole('button', { name: 'impersonation.confirm' })
    );

    expect(await screen.findByText('impersonation.failed')).toBeInTheDocument();
    expect(website.close).toHaveBeenCalled();
    expect(startPreviewHandshake).not.toHaveBeenCalled();
  });
});
