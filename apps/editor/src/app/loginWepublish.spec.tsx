import { CombinedGraphQLErrors } from '@apollo/client';
import { render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { LoginWepublish } from './loginWepublish';
import {
  takeCapturedWepublishLoginResult,
  takeWepublishLoginAttempt,
} from './wepublishLogin';

const navigate = vi.fn();
const authenticate = vi.fn();
const authDispatch = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', () => ({
  LocalStorageKey: { SessionToken: 'sessionToken' },
  CreateSessionWithWepublishLoginDocument:
    'CreateSessionWithWepublishLoginDocument',
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [authenticate, { loading: false }],
}));

vi.mock('@wepublish/ui/editor', () => ({
  AuthDispatchActionType: { Login: 'login' },
  AuthDispatchContext: { Provider: ({ children }: never) => children },
  LoginTemplate: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('./ui/loginBackground', () => ({ Background: () => null }));

vi.mock('./wepublishLogin', async importOriginal => ({
  ...(await importOriginal<typeof import('./wepublishLogin')>()),
  captureWepublishLoginResult: vi.fn(),
  takeCapturedWepublishLoginResult: vi.fn(),
  takeWepublishLoginAttempt: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useContext: () => authDispatch };
});

const session = (overrides: Record<string, unknown> = {}) => ({
  data: {
    createSessionWithWepublishLogin: {
      token: 'session-token',
      user: {
        email: 'jane@wepublish.ch',
        roles: [{ permissions: [{ id: 'CAN_LOGIN_EDITOR' }] }],
      },
      ...overrides,
    },
  },
});

describe('LoginWepublish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (takeCapturedWepublishLoginResult as Mock).mockReturnValue({
      code: 'the-code',
      state: 'state-1',
    });
    (takeWepublishLoginAttempt as Mock).mockReturnValue({
      state: 'state-1',
      verifier: 'the-verifier',
    });
  });

  it('signs in with the code and the verifier this tab kept', async () => {
    (authenticate as Mock).mockResolvedValue(session());

    render(<LoginWepublish />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/', { replace: true })
    );
    expect(takeWepublishLoginAttempt).toHaveBeenCalledWith('state-1');
    expect(authenticate).toHaveBeenCalledWith({
      variables: { code: 'the-code', codeVerifier: 'the-verifier' },
    });
    expect(localStorage.getItem('sessionToken')).toBe('session-token');
    expect(authDispatch).toHaveBeenCalledWith({
      type: 'login',
      payload: {
        email: 'jane@wepublish.ch',
        sessionToken: 'session-token',
        sessionRoles: [{ permissions: [{ id: 'CAN_LOGIN_EDITOR' }] }],
      },
    });
  });

  it('refuses when no code came back', async () => {
    (takeCapturedWepublishLoginResult as Mock).mockReturnValue(null);

    render(<LoginWepublish />);

    await screen.findByText('login.wepublish.failed');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('refuses a login this tab did not start, without asking the api', async () => {
    (takeWepublishLoginAttempt as Mock).mockReturnValue(null);

    render(<LoginWepublish />);

    await screen.findByText('login.wepublish.failed');
    expect(authenticate).not.toHaveBeenCalled();
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });

  it('refuses an account that may not use the editor', async () => {
    (authenticate as Mock).mockResolvedValue(
      session({ user: { email: 'jane@wepublish.ch', roles: [] } })
    );

    render(<LoginWepublish />);

    await screen.findByText('login.unauthorized');
    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(authDispatch).not.toHaveBeenCalled();
  });

  it('says so when the We.Publish account has no access to this editor', async () => {
    (authenticate as Mock).mockRejectedValue(
      new CombinedGraphQLErrors({
        errors: [
          {
            message: 'We.Publish account lacks the role login-cms-admin-review',
            extensions: { code: 'FORBIDDEN' },
          },
        ],
      })
    );

    render(<LoginWepublish />);

    await screen.findByText('login.wepublish.forbidden');
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });

  it('says so when the api refuses the code', async () => {
    (authenticate as Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginWepublish />);

    await screen.findByText('login.wepublish.failed');
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });
});
