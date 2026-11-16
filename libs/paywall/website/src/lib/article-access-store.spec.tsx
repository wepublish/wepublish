import { act, renderHook } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { mockArticleAccess } from '@wepublish/mocks/website';
import { PropsWithChildren } from 'react';
import {
  clearArticleAccess,
  setArticleAccess,
  useArticleAccess,
} from './article-access-store';

describe('useArticleAccess', () => {
  let user: { id: string } | null;

  const wrapper = ({ children }: PropsWithChildren) => (
    <SessionTokenContext.Provider
      value={[user as never, !!user, async () => undefined]}
    >
      {children}
    </SessionTokenContext.Provider>
  );

  beforeEach(() => {
    user = null;
    clearArticleAccess();
  });

  it('follows what the server decided for an article', () => {
    const { result } = renderHook(() => useArticleAccess('a'), { wrapper });

    act(() => setArticleAccess('a', mockArticleAccess(), undefined));

    expect(result.current).toEqual(mockArticleAccess());
  });

  it('forgets a decision once someone else reads, after a login or logout', () => {
    user = { id: 'user-1' };
    const { result, rerender } = renderHook(() => useArticleAccess('a'), {
      wrapper,
    });

    act(() => setArticleAccess('a', mockArticleAccess(), 'user-1'));
    expect(result.current).toBeDefined();

    user = null;
    rerender();
    expect(result.current).toBeUndefined();

    user = { id: 'user-2' };
    rerender();
    expect(result.current).toBeUndefined();
  });
});
