import { renderHook } from '@testing-library/react';

import { useWebsiteShell } from './website-shell';

const matches = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ matches: matches() }),
}));

describe('useWebsiteShell', () => {
  it('shows both when no route asked for anything', () => {
    matches.mockReturnValue([{ loaderData: undefined }]);

    expect(renderHook(() => useWebsiteShell()).result.current).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });

  it('takes the shell from the matched route', () => {
    matches.mockReturnValue([
      { loaderData: undefined },
      { loaderData: { shell: { showNavigation: false, showFooter: true } } },
    ]);

    expect(renderHook(() => useWebsiteShell()).result.current).toEqual({
      showNavigation: false,
      showFooter: true,
    });
  });

  it('lets the deepest route win, not the root', () => {
    matches.mockReturnValue([
      { loaderData: { shell: { showNavigation: true, showFooter: true } } },
      { loaderData: { shell: { showNavigation: false, showFooter: false } } },
    ]);

    expect(renderHook(() => useWebsiteShell()).result.current).toEqual({
      showNavigation: false,
      showFooter: false,
    });
  });

  it('ignores matches that carry loader data but no shell', () => {
    matches.mockReturnValue([
      { loaderData: { shell: { showNavigation: false, showFooter: false } } },
      { loaderData: { somethingElse: true } },
    ]);

    expect(renderHook(() => useWebsiteShell()).result.current).toEqual({
      showNavigation: false,
      showFooter: false,
    });
  });
});
