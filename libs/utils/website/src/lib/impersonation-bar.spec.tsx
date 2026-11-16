import { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  CurrentSessionDocument,
  EndImpersonationDocument,
} from '@wepublish/website/api';

import { ImpersonationBar } from './impersonation-bar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

const currentSession = (impersonatedBy: string | null) => ({
  request: { query: CurrentSessionDocument },
  result: {
    data: {
      currentSession: {
        __typename: 'CurrentSession',
        impersonatedBy,
        expiresAt: '2030-01-01T00:00:00.000Z',
      },
    },
  },
});

const reader = {
  __typename: 'SensitiveDataUser',
  id: 'user-2',
  firstName: 'Rita',
  name: 'Reader',
  email: 'reader@medium.ch',
};

const renderBar = ({
  hasUser = true,
  mocks = [] as MockLink.MockedResponse[],
  setToken = vi.fn().mockResolvedValue(undefined),
  navigate = vi.fn(),
} = {}) => {
  render(
    <MockedProvider mocks={mocks}>
      <SessionTokenContext.Provider
        value={[hasUser ? (reader as never) : null, hasUser, setToken]}
      >
        <ImpersonationBar navigate={navigate} />
      </SessionTokenContext.Provider>
    </MockedProvider>
  );

  return { setToken, navigate };
};

describe('ImpersonationBar', () => {
  it('stays hidden without a signed-in user', () => {
    renderBar({ hasUser: false });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('stays hidden in an ordinary session', async () => {
    renderBar({ mocks: [currentSession(null)] });

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says whose session this is and who opened it', async () => {
    renderBar({ mocks: [currentSession('jane@wepublish.ch')] });

    expect(
      await screen.findByText(
        'login.impersonation.active:Rita Reader,jane@wepublish.ch'
      )
    ).toBeInTheDocument();
  });

  it('ends the session on the server and signs out', async () => {
    const endImpersonation = vi.fn(() => ({
      data: { revokeActiveSession: true },
    }));
    const { setToken, navigate } = renderBar({
      mocks: [
        currentSession('jane@wepublish.ch'),
        {
          request: { query: EndImpersonationDocument },
          result: endImpersonation,
        },
      ],
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'login.impersonation.end' })
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'));
    expect(endImpersonation).toHaveBeenCalled();
    expect(setToken).toHaveBeenCalledWith(null);
  });
});
