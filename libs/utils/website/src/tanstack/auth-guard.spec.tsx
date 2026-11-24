import { render } from '@testing-library/react';
import { IntendedRouteStorageKey } from '@wepublish/authentication/website';
import { setCookie } from 'cookies-next';

import { withAuthGuard } from './auth-guard';

const navigate = vi.fn();
const user = vi.hoisted(() => ({ hasUser: false }));
const path = vi.hoisted(() => ({ current: '/profile' }));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

vi.mock('./router-hooks', () => ({
  useAsPath: () => path.current,
}));

vi.mock('@wepublish/authentication/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  useUser: () => user,
}));

vi.mock('cookies-next', () => ({ setCookie: vi.fn() }));

const Guarded = withAuthGuard(() => <p>members only</p>);

describe('withAuthGuard', () => {
  beforeEach(() => {
    user.hasUser = false;
    path.current = '/profile';
    navigate.mockClear();
    (setCookie as ReturnType<typeof vi.fn>).mockClear();
  });

  it('sends a visitor to the login and remembers where they were going', () => {
    const { container } = render(<Guarded />);

    expect(container.textContent).toBe('');
    expect(navigate).toHaveBeenCalledWith({ to: '/login' });
    expect(setCookie).toHaveBeenCalledWith(
      IntendedRouteStorageKey,
      '/profile',
      expect.anything()
    );
  });

  // The cookie outlives the visit: a token or login code in the address must
  // not be kept in it.
  it('does not remember tokens from the address', () => {
    path.current = '/welcome?src=purl&jwt=secret&loginCode=ABCDE-12345';

    render(<Guarded />);

    expect(setCookie).toHaveBeenCalledWith(
      IntendedRouteStorageKey,
      '/welcome?src=purl',
      expect.anything()
    );
  });

  it('shows the page to a reader who is logged in', () => {
    user.hasUser = true;

    const { container } = render(<Guarded />);

    expect(container.textContent).toBe('members only');
    expect(navigate).not.toHaveBeenCalled();
  });
});
