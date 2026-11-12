import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import {
  CurrentSessionDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { SessionTokenContext } from './session.context';
import { useAccountSetupPending } from './use-account-setup-pending';

const currentSession = (restricted: boolean) => ({
  request: { query: CurrentSessionDocument },
  delay: 0,
  result: {
    data: {
      currentSession: {
        __typename: 'SessionInfo',
        origin: 'purl',
        restricted,
        placeholderEmail: restricted,
        secondFactor: 'none',
        canReplaceEmail: false,
        createdAt: '2026-10-11T08:00:00.000Z',
        expiresAt: '2026-11-11T08:00:00.000Z',
      },
    },
  },
});

const settings = (loginCodeEnabled: boolean) => ({
  request: { query: SettingListDocument },
  delay: 0,
  result: {
    data: {
      settings: [
        {
          __typename: 'Setting',
          id: 'login-code-enabled',
          name: SettingName.LoginCodeEnabled,
          value: loginCodeEnabled,
        },
      ],
    },
  },
});

const pendingFor = async ({
  hasUser = true,
  loginCodeEnabled,
  restricted,
}: {
  hasUser?: boolean;
  loginCodeEnabled: boolean;
  restricted: boolean;
}) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MockedProvider
      mocks={[currentSession(restricted), settings(loginCodeEnabled)]}
    >
      <SessionTokenContext.Provider
        value={[
          hasUser ? ({ id: 'user-1' } as never) : null,
          hasUser,
          async () => undefined,
        ]}
      >
        {children}
      </SessionTokenContext.Provider>
    </MockedProvider>
  );
  const { result } = renderHook(() => useAccountSetupPending(), { wrapper });

  return result;
};

describe('useAccountSetupPending', () => {
  it('is pending for a session from a personal login code until the setup', async () => {
    const result = await pendingFor({
      loginCodeEnabled: true,
      restricted: true,
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it.each([
    [
      'the session is not restricted',
      { loginCodeEnabled: true, restricted: false },
    ],
    [
      'the medium has login codes switched off',
      { loginCodeEnabled: false, restricted: true },
    ],
    [
      'nobody is logged in',
      { hasUser: false, loginCodeEnabled: true, restricted: true },
    ],
  ])('is not pending when %s', async (_label, state) => {
    const result = await pendingFor(state);

    // Give the queries time to answer before checking.
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(result.current).toBe(false);
  });
});
