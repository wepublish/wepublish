import { composeStory } from '@storybook/react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import * as config from '@wepublish/storybook';
import { WithUserDecorator } from '@wepublish/storybook';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { actWait } from '@wepublish/testing';
import {
  CurrentSessionDocument,
  RequestEmailChangeDocument,
} from '@wepublish/website/api';
import { GraphQLError } from 'graphql';
import { ComponentType } from 'react';
import de from '@wepublish/website/translations/de.json';
import { WelcomePage } from './welcome-page';

const router = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: router.query,
    asPath: '/welcome',
    push: vi.fn(),
    replace: router.replace,
  }),
}));

const session = (
  placeholderEmail: boolean,
  restricted = true,
  { secondFactor = 'none', canReplaceEmail = placeholderEmail } = {}
) => ({
  request: { query: CurrentSessionDocument },
  // Answer right away instead of after MockLink's simulated network delay.
  delay: 0,
  result: {
    data: {
      currentSession: {
        __typename: 'SessionInfo',
        origin: 'purl',
        restricted,
        placeholderEmail,
        secondFactor,
        canReplaceEmail,
        createdAt: '2026-10-11T08:00:00.000Z',
        expiresAt: '2026-11-11T08:00:00.000Z',
      },
    },
  },
});

const emailChange = (result: object) => ({
  request: {
    query: RequestEmailChangeDocument,
    variables: { newEmail: 'reader@example.com' },
  },
  delay: 0,
  result,
});

const renderWelcome = async (
  placeholderEmail: boolean,
  mocks: object[] = [],
  restricted = true,
  sessionOptions: Parameters<typeof session>[2] = {},
  refreshUser?: () => Promise<void>
) => {
  const Welcome = composeStory(
    {
      render: () => <WelcomePage />,
      decorators: [
        refreshUser ?
          (Story: ComponentType) => (
            <SessionTokenContext.Provider
              value={[
                { id: 'user-1' } as never,
                true,
                async () => undefined,
                refreshUser,
              ]}
            >
              <Story />
            </SessionTokenContext.Provider>
          )
        : WithUserDecorator({ id: 'user-1' } as never),
      ],
      parameters: {
        apolloClient: {
          mocks: [
            session(placeholderEmail, restricted, sessionOptions),
            ...mocks,
          ],
        },
      },
    },
    { title: 'Welcome' },
    config
  );

  render(<Welcome />);
  await actWait();
};

const click = (name: string) =>
  act(() => fireEvent.click(screen.getByRole('button', { name })));

describe('WelcomePage', () => {
  afterEach(() => {
    cleanup();
    router.query = {};
    router.replace.mockReset();
  });

  // The profile reads the user from the session provider, which fetched them
  // when the page was opened. By now the address was confirmed, so the user
  // is fetched again before the profile gets to show them.
  it('fetches the reader again before moving on to the profile', async () => {
    router.query = { emailConfirmed: '1' };
    const order: string[] = [];
    const refreshUser = vi.fn(async () => {
      order.push('refresh');
    });
    router.replace.mockImplementation(() => order.push('replace'));

    await renderWelcome(false, [], false, {}, refreshUser);
    await click(de.welcome.skip);
    await actWait();

    expect(order).toEqual(['refresh', 'replace']);
    expect(router.replace).toHaveBeenCalledWith('/profile');
  });

  it('goes back to the intro when entering an address is cancelled', async () => {
    await renderWelcome(true);
    await click(de.welcome.continue);
    expect(screen.getByText(de.welcome.emailPlaceholderInfo)).toBeTruthy();

    await click(de.welcome.back);
    expect(screen.queryByText(de.welcome.emailPlaceholderInfo)).toBeNull();
    expect(
      screen.getByRole('button', { name: de.welcome.continue })
    ).toBeTruthy();
  });

  it('goes back to confirming the current address when entering another one is cancelled', async () => {
    await renderWelcome(false, [], false);

    await click(de.welcome.continue);
    await click(de.welcome.emailChange);
    expect(screen.getByText(de.welcome.emailPlaceholderInfo)).toBeTruthy();

    await click(de.welcome.back);
    expect(screen.queryByText(de.welcome.emailPlaceholderInfo)).toBeNull();
    expect(
      screen.getByRole('button', { name: de.welcome.emailVerify })
    ).toBeTruthy();
  });

  // The API lets a session from a personal login code change a real address
  // only after confirming it, so a stranger holding the letter can't take the
  // account over.
  it('offers no other address while no second factor guards the account', async () => {
    await renderWelcome(false);
    await click(de.welcome.continue);

    expect(
      screen.getByRole('button', { name: de.welcome.emailVerify })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: de.welcome.emailChange })
    ).toBeNull();
  });

  // The address on file may look fine and still be dead (outdated,
  // abandoned): with the second factor from the letter, it can be replaced.
  it('lets an outdated address be replaced with the second factor from the letter', async () => {
    await renderWelcome(false, [], true, {
      secondFactor: 'postalCode',
      canReplaceEmail: true,
    });
    await click(de.welcome.continue);
    await click(de.welcome.emailOutdated);

    expect(screen.getByLabelText(de.welcome.emailLabel)).toBeTruthy();
    expect(
      screen.getByLabelText(de.welcome.secondFactor.postalCode)
    ).toBeTruthy();
  });

  it('lines the buttons up on the right, the main one furthest right', async () => {
    await renderWelcome(true);

    const main = screen.getByRole('button', { name: de.welcome.continue });
    const row = main.parentElement as HTMLElement;

    expect(getComputedStyle(row).flexDirection).toBe('row-reverse');
    expect(row.firstElementChild).toBe(main);
  });

  describe('asking for the confirmation mail again', () => {
    const sendTo = async (mocks: object[]) => {
      await renderWelcome(true, mocks);
      await click(de.welcome.continue);
      await act(() =>
        fireEvent.change(screen.getByLabelText(de.welcome.emailLabel), {
          target: { value: 'reader@example.com' },
        })
      );
      await click(de.welcome.emailSubmit);
      await actWait();
    };

    it('waits as long as the API does before a new mail may be requested', async () => {
      await sendTo([emailChange({ data: { requestEmailChange: true } })]);

      const resend = screen.getByRole('button', {
        name: de.welcome.resendIn.replace('{seconds}', '60'),
      });

      expect(resend.hasAttribute('disabled')).toBe(true);
    });

    it('explains the wait in words instead of the API message', async () => {
      await sendTo([
        emailChange({
          errors: [
            new GraphQLError(
              'Please wait a moment before requesting another confirmation email.'
            ),
          ],
        }),
      ]);

      const note = screen.getByText(de.welcome.resendTooSoon);

      // A gentle note, not an error.
      expect(note.closest('.MuiAlert-colorInfo')).not.toBeNull();
      expect(document.querySelector('.MuiAlert-colorError')).toBeNull();
      expect(screen.queryByText(/Please wait a moment/)).toBeNull();
    });
  });
});
