import { render, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { LoginImpersonate } from './loginImpersonate';

const navigate = vi.fn();
const authenticate = vi.fn();
const authDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => ({ jwt: 'the-grant' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  LocalStorageKey: { SessionToken: 'sessionToken' },
  useCreateSessionWithJwtMutation: () => [authenticate],
}));

vi.mock('@wepublish/ui/editor', () => ({
  AuthDispatchActionType: { Login: 'login' },
  AuthDispatchContext: { Provider: ({ children }: never) => children },
  LoginTemplate: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('./ui/loginBackground', () => ({ Background: () => null }));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useContext: () => authDispatch };
});

const session = (overrides: Record<string, unknown> = {}) => ({
  data: {
    createSessionWithJWT: {
      token: 'session-token',
      impersonated: true,
      user: {
        email: 'target@example.com',
        roles: [{ permissions: [{ id: 'CAN_LOGIN_EDITOR' }] }],
      },
      ...overrides,
    },
  },
});

describe('LoginImpersonate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('signs the operator in when the grant produced an impersonated session', async () => {
    (authenticate as Mock).mockResolvedValue(session());

    render(<LoginImpersonate />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/', { replace: true })
    );
    expect(localStorage.getItem('sessionToken')).toBe('session-token');
    expect(authDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ sessionToken: 'session-token' }),
      })
    );
  });

  it('refuses an ordinary JWT login, which would otherwise skip TOTP', async () => {
    (authenticate as Mock).mockResolvedValue(session({ impersonated: false }));

    render(<LoginImpersonate />);

    await waitFor(() => expect(authenticate).toHaveBeenCalled());
    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(authDispatch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith('/', { replace: true });
  });

  it('refuses a user who may not use the editor', async () => {
    (authenticate as Mock).mockResolvedValue(
      session({
        user: {
          email: 'reader@example.com',
          roles: [{ permissions: [{ id: 'CAN_GET_ARTICLE' }] }],
        },
      })
    );

    render(<LoginImpersonate />);

    await waitFor(() => expect(authenticate).toHaveBeenCalled());
    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(authDispatch).not.toHaveBeenCalled();
  });

  it('does not store a session when the grant is already spent', async () => {
    (authenticate as Mock).mockRejectedValue(new Error('invalid credentials'));

    render(<LoginImpersonate />);

    await waitFor(() => expect(authenticate).toHaveBeenCalled());
    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(authDispatch).not.toHaveBeenCalled();
  });
});
