import { render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { LoginSupport } from './loginSupport';
import {
  takeCapturedSupportLoginResult,
  takeSupportLoginAttempt,
} from './supportLogin';

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
  CreateSessionWithJwtDocument: 'CreateSessionWithJwtDocument',
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

vi.mock('./supportLogin', () => ({
  captureSupportLoginResult: vi.fn(),
  takeCapturedSupportLoginResult: vi.fn(),
  takeSupportLoginAttempt: vi.fn(),
}));

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
        email: 'admin@wepublish.ch',
        roles: [{ permissions: [{ id: 'CAN_LOGIN_EDITOR' }] }],
      },
      ...overrides,
    },
  },
});

describe('LoginSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (takeCapturedSupportLoginResult as Mock).mockReturnValue({
      code: 'the-grant',
      state: 'state-1',
    });
    (takeSupportLoginAttempt as Mock).mockReturnValue({
      state: 'state-1',
      verifier: 'the-verifier',
    });
  });

  it('signs in with the code and the verifier this tab kept', async () => {
    (authenticate as Mock).mockResolvedValue(session());

    render(<LoginSupport />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/', { replace: true })
    );
    expect(takeSupportLoginAttempt).toHaveBeenCalledWith('state-1');
    expect(authenticate).toHaveBeenCalledWith({
      variables: { jwt: 'the-grant', codeVerifier: 'the-verifier' },
    });
    expect(localStorage.getItem('sessionToken')).toBe('session-token');
  });

  it('refuses when no code came back', async () => {
    (takeCapturedSupportLoginResult as Mock).mockReturnValue(null);

    render(<LoginSupport />);

    await screen.findByText('login.support.failed');
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('refuses a login this tab did not start, without asking the api', async () => {
    (takeSupportLoginAttempt as Mock).mockReturnValue(null);

    render(<LoginSupport />);

    await screen.findByText('login.support.failed');
    expect(authenticate).not.toHaveBeenCalled();
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });

  it('refuses a session that is not a support login', async () => {
    (authenticate as Mock).mockResolvedValue(session({ impersonated: false }));

    render(<LoginSupport />);

    await screen.findByText('login.support.failed');
    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(authDispatch).not.toHaveBeenCalled();
  });

  it('refuses an account that may not use the editor', async () => {
    (authenticate as Mock).mockResolvedValue(
      session({ user: { email: 'admin@wepublish.ch', roles: [] } })
    );

    render(<LoginSupport />);

    await screen.findByText('login.unauthorized');
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });

  it('says so when the api refuses the code', async () => {
    (authenticate as Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginSupport />);

    await screen.findByText('login.support.failed');
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });
});
