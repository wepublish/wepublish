import { render, waitFor } from '@testing-library/react';

import { loginCodeOutcome, LoginCodeRedeemed } from './login-code';

const setToken = vi.fn(async () => undefined);

vi.mock('@wepublish/authentication/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  useUser: () => ({ setToken, hasUser: false }),
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<object>()),
  useWebsiteBuilder: () => ({
    elements: {
      Paragraph: ({ children }: { children: unknown }) => <p>{children as never}</p>,
    },
  }),
}));

vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const session = {
  token: 'session-token',
  createdAt: '2026-11-01T08:00:00.000Z',
  expiresAt: '2026-12-01T08:00:00.000Z',
};

describe('loginCodeOutcome', () => {
  it('hands a redeemed code on as the session it opened', () => {
    expect(loginCodeOutcome({ kind: 'ok', session } as never)).toEqual({
      kind: 'ok',
      sessionToken: { __typename: 'SessionWithTokenWithoutUser', ...session },
    });
  });

  it.each(['totpRequired', 'challengeRequired'] as const)(
    'passes on that the code still needs a step (%s)',
    kind => {
      expect(loginCodeOutcome({ kind })).toEqual({ kind });
    }
  );

  it('says why a refused code was refused', () => {
    expect(
      loginCodeOutcome({ kind: 'failed', message: 'LOGIN_CODE_DISABLED' })
    ).toEqual({ kind: 'failed', failure: 'disabled' });
  });
});

describe('LoginCodeRedeemed', () => {
  it('takes over the session and only then moves on', async () => {
    const onRedeemed = vi.fn();
    const sessionToken = {
      __typename: 'SessionWithTokenWithoutUser' as const,
      ...session,
    };

    render(
      <LoginCodeRedeemed
        sessionToken={sessionToken}
        onRedeemed={onRedeemed}
      />
    );

    await waitFor(() => expect(onRedeemed).toHaveBeenCalledTimes(1));
    expect(setToken).toHaveBeenCalledWith(sessionToken);
  });
});
