import type { Mock } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useExternalAppSrc } from './useExternalAppSrc';
import { useCreateExternalAppTokenMutation } from '@wepublish/editor/api';

vi.mock('@wepublish/editor/api', () => ({
  useCreateExternalAppTokenMutation: vi.fn(),
}));

const mockedMutation = useCreateExternalAppTokenMutation as Mock;
const createToken = vi.fn();

const app = { id: 'app-1', url: 'http://localhost:3177' };

const mitToken = (value?: string, error?: Error) => {
  mockedMutation.mockReturnValue([
    createToken,
    {
      data:
        value ?
          { createExternalAppToken: { token: value, expiresAt: '2026-09-09' } }
        : undefined,
      loading: false,
      error,
      called: true,
    },
  ]);
};

beforeEach(() => {
  createToken.mockClear();
  mockedMutation.mockReset();
});

describe('useExternalAppSrc', () => {
  it('asks for nothing without an app', () => {
    mockedMutation.mockReturnValue([
      createToken,
      { data: undefined, loading: false, error: undefined, called: false },
    ]);

    const { result } = renderHook(() => useExternalAppSrc(undefined));

    expect(createToken).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      src: undefined,
      loading: false,
      error: undefined,
    });
  });

  it('asks for a token once and waits for it', () => {
    mockedMutation.mockReturnValue([
      createToken,
      { data: undefined, loading: false, error: undefined, called: false },
    ]);

    const { result, rerender } = renderHook(() => useExternalAppSrc(app));
    rerender();

    expect(createToken).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledWith({
      variables: { externalAppId: 'app-1' },
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.src).toBeUndefined();
  });

  it('puts the token in the fragment', () => {
    mitToken('a-jwt');

    const { result } = renderHook(() => useExternalAppSrc(app));

    expect(result.current.src).toBe('http://localhost:3177#token=a-jwt');
    expect(result.current.loading).toBe(false);
  });

  it('adds the article and the revision when they are known', () => {
    mitToken('a-jwt');

    const { result } = renderHook(() =>
      useExternalAppSrc(app, { articleId: 'art-7', revision: 'draft' })
    );

    expect(result.current.src).toBe(
      'http://localhost:3177#token=a-jwt&articleId=art-7&revision=draft'
    );
  });

  it('encodes values that carry url characters', () => {
    mitToken('he/ad.pay+load==');

    const { result } = renderHook(() =>
      useExternalAppSrc(app, { articleId: 'a b&c' })
    );

    expect(result.current.src).toBe(
      `http://localhost:3177#token=${encodeURIComponent('he/ad.pay+load==')}&articleId=${encodeURIComponent('a b&c')}`
    );
  });

  it('reports a failed token instead of a src', () => {
    mitToken(undefined, new Error('Not allowed'));

    const { result } = renderHook(() => useExternalAppSrc(app));

    expect(result.current.src).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toBe('Not allowed');
  });
});
