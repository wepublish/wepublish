import { render } from '@testing-library/react';

import { RestrictedSessionRedirect } from './restricted-session-redirect';

const navigate = vi.fn();
const route = vi.hoisted(() => ({ fullPath: '/a/$slug' }));
const session = vi.hoisted(() => ({ restricted: true }));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouterState: ({
    select,
  }: {
    select: (state: { matches: { fullPath: string }[] }) => unknown;
  }) =>
    select({ matches: [{ fullPath: '/' }, { fullPath: route.fullPath }] }),
}));

vi.mock('../lib/restricted-session', () => ({
  useRestrictedSession: () => session.restricted,
}));

const renderOn = (fullPath: string) => {
  route.fullPath = fullPath;

  return render(
    <RestrictedSessionRedirect>
      <p>page</p>
    </RestrictedSessionRedirect>
  );
};

describe('RestrictedSessionRedirect', () => {
  beforeEach(() => {
    session.restricted = true;
    navigate.mockClear();
  });

  // A session from a personal login code may only finish the welcome steps.
  it('keeps a restricted session on the welcome page', () => {
    const { container } = renderOn('/a/$slug');

    expect(navigate).toHaveBeenCalledWith({ href: '/welcome', replace: true });
    expect(container.textContent).toBe('page');
  });

  it.each(['/welcome', '/confirm-email', '/login', '/l/$code'])(
    'leaves a restricted session alone on %s',
    fullPath => {
      renderOn(fullPath);

      expect(navigate).not.toHaveBeenCalled();
    }
  );

  // The router names an index route with a trailing slash.
  it('reads a trailing slash as the same page', () => {
    renderOn('/welcome/');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('lets every other session go anywhere', () => {
    session.restricted = false;

    renderOn('/a/$slug');

    expect(navigate).not.toHaveBeenCalled();
  });
});
