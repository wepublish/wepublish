import { render, screen } from '@testing-library/react';

import Login from '../pages/login';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, replace: vi.fn() }),
}));

vi.mock('@wepublish/authentication/website', () => ({
  IntendedRouteExpiryInSeconds: 3600,
  IntendedRouteStorageKey: 'intended-route',
  LoginFormContainer: () => null,
  useUser: () => ({ hasUser: false, setToken: vi.fn() }),
}));

vi.mock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    elements: {
      H3: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
      Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    },
  }),
}));

vi.mock('@wepublish/utils/website', () => ({}));
vi.mock('@wepublish/website/api', () => ({}));

describe('munotgloeggli login', () => {
  it('addresses members, not subscribers', () => {
    render(<Login />);

    expect(
      screen.getByRole('heading', { name: 'Login für Mitglieder' })
    ).toBeTruthy();
  });
});
