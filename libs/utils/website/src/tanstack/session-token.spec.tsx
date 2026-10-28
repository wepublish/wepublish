import { renderHook } from '@testing-library/react';

import { useRouteSessionToken } from './session-token';

const matches = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ matches: matches() }),
}));

const token = { token: 'abc', expiresAt: '2026-01-01T00:00:00.000Z' };

describe('useRouteSessionToken', () => {
  it('is null when no route authenticated', () => {
    matches.mockReturnValue([{ loaderData: undefined }]);

    expect(renderHook(() => useRouteSessionToken()).result.current).toBeNull();
  });

  it('takes the token from the matched route', () => {
    matches.mockReturnValue([
      { loaderData: undefined },
      { loaderData: { sessionToken: token } },
    ]);

    expect(renderHook(() => useRouteSessionToken()).result.current).toBe(token);
  });

  it('is null when the route ran but found no session', () => {
    matches.mockReturnValue([{ loaderData: { sessionToken: null } }]);

    expect(renderHook(() => useRouteSessionToken()).result.current).toBeNull();
  });

  it('ignores matches that carry loader data but no token', () => {
    matches.mockReturnValue([
      { loaderData: { sessionToken: token } },
      { loaderData: { shell: { showNavigation: true } } },
    ]);

    expect(renderHook(() => useRouteSessionToken()).result.current).toBe(token);
  });

  it('lets the deepest authenticated route win', () => {
    const deeper = { token: 'deeper', expiresAt: token.expiresAt };

    matches.mockReturnValue([
      { loaderData: { sessionToken: token } },
      { loaderData: { sessionToken: deeper } },
    ]);

    expect(renderHook(() => useRouteSessionToken()).result.current).toBe(
      deeper
    );
  });
});
