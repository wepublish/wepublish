import { composeStory } from '@storybook/react';
import { cleanup, render, screen } from '@testing-library/react';
import * as config from '@wepublish/storybook';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { ComponentType } from 'react';
import de from '@wepublish/website/translations/de.json';
import {
  createLoginCodePage,
  LoginCodeFailure,
  loginCodeFailure,
} from './login-code-page';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, replace: vi.fn(), push: vi.fn() }),
}));

describe('loginCodeFailure', () => {
  it.each([
    ['LOGIN_CODE_INVALID', 'invalid'],
    ['LOGIN_CODE_DISABLED', 'disabled'],
    ['The user account is not active.', 'inactive'],
    ['TOO_MANY_ATTEMPTS', 'tooManyAttempts'],
    ['something unexpected', 'invalid'],
  ])('reads %j as %s', (message, failure) => {
    expect(loginCodeFailure(message)).toBe(failure);
  });
});

describe('login code page after a failed code', () => {
  afterEach(cleanup);

  const renderFailure = (failure: LoginCodeFailure, loggedIn: boolean) => {
    const { Page } = createLoginCodePage();
    const Story = composeStory(
      {
        render: () => <Page failure={failure} />,
        decorators: [
          (Story: ComponentType) => (
            <SessionTokenContext.Provider
              value={[
                loggedIn ? ({ id: 'user-1' } as never) : null,
                loggedIn,
                async () => undefined,
              ]}
            >
              <Story />
            </SessionTokenContext.Provider>
          ),
        ],
      },
      { title: 'Login code page' },
      config
    );

    render(<Story />);
  };

  it.each(['invalid', 'disabled', 'inactive', 'tooManyAttempts'] as const)(
    'says why the link did not work (%s)',
    failure => {
      renderFailure(failure, false);

      expect(screen.getByText(de.login.code.failed[failure])).toBeTruthy();
      expect(
        screen.getByRole('link', { name: de.login.code.failed.toLogin })
      ).toBeTruthy();
    }
  );

  it('offers to continue a session that is still open, instead of silently doing so', () => {
    renderFailure('invalid', true);

    expect(
      screen.getByRole('link', { name: de.login.code.failed.continue })
    ).toBeTruthy();
  });

  it('offers no session to continue when nobody is logged in', () => {
    renderFailure('invalid', false);

    expect(
      screen.queryByRole('link', { name: de.login.code.failed.continue })
    ).toBeNull();
  });
});
