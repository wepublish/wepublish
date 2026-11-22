import { ApolloClient } from '@apollo/client';
import { render, screen } from '@testing-library/react';
import { MeDocument, SessionInfoDocument } from '@wepublish/website/api';
import { ComponentType } from 'react';

import { createWelcomePage, prefetchWelcome } from './welcome-page';

const navigate = vi.fn();
const query = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const welcome = vi.hoisted(() => ({
  props: undefined as
    | { emailConfirmed?: boolean; onDone: () => void }
    | undefined,
}));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useNavigate: () => navigate,
}));

vi.mock('../auth-guard', () => ({
  withAuthGuard: (Cmp: ComponentType) => Cmp,
}));

vi.mock('../router-hooks', () => ({
  useQueryParams: () => query.current,
}));

// The steps themselves are the core's and have their own spec.
vi.mock('../../lib/components/welcome/welcome', () => ({
  Welcome: (props: NonNullable<typeof welcome.props>) => {
    welcome.props = props;

    return <div data-testid="welcome" />;
  },
}));

describe('prefetchWelcome', () => {
  // The first step depends on both: without them the server renders the
  // steps of a session that is not restricted.
  it('fetches the reader and what their session may do', async () => {
    const clientQuery = vi.fn().mockResolvedValue({ data: {} });

    await prefetchWelcome({ query: clientQuery } as unknown as ApolloClient);

    expect(clientQuery.mock.calls.map(([options]) => options.query)).toEqual(
      expect.arrayContaining([MeDocument, SessionInfoDocument])
    );
  });
});

describe('WelcomePage', () => {
  beforeEach(() => {
    query.current = {};
    navigate.mockClear();
    welcome.props = undefined;
  });

  it('starts at the beginning on a plain visit', () => {
    const WelcomePage = createWelcomePage();

    render(<WelcomePage />);

    expect(screen.getByTestId('welcome')).toBeTruthy();
    expect(welcome.props?.emailConfirmed).toBe(false);
  });

  // The confirm-email page sends the reader back with `?emailConfirmed=1`.
  it('goes on after the email address was confirmed', () => {
    query.current = { emailConfirmed: '1' };
    const WelcomePage = createWelcomePage();

    render(<WelcomePage />);

    expect(welcome.props?.emailConfirmed).toBe(true);
  });

  it('ends on the profile, replacing the welcome page in the history', () => {
    const WelcomePage = createWelcomePage({ profilePath: '/konto' });

    render(<WelcomePage />);
    welcome.props?.onDone();

    expect(navigate).toHaveBeenCalledWith({ href: '/konto', replace: true });
  });
});
