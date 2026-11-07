import { renderHook, waitFor } from '@testing-library/react';
import { CreateExternalAppTokenDocument } from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { externalAppSrc, useExternalAppSrc } from './useExternalAppSrc';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as Mock;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mint = mutationFor(CreateExternalAppTokenDocument);
const app = { id: 'app-1', url: 'https://tool.example.com/' };

beforeEach(() => {
  mint.mockReset();
  mint.mockResolvedValue({
    data: {
      createExternalAppToken: {
        token: 'jwt.a.b',
        expiresAt: '2026-10-13T16:00:00.000Z',
      },
    },
  });
});

describe('externalAppSrc', () => {
  it('keeps the query string and puts the token in the fragment', () => {
    expect(externalAppSrc('https://t.example/p?x=1', 'jwt.a.b')).toBe(
      'https://t.example/p?x=1#token=jwt.a.b'
    );
  });

  it('appends the context and skips undefined values', () => {
    expect(
      externalAppSrc('https://t.example/', 'jwt.a.b', {
        articleId: 'art-1',
        revision: 3,
      })
    ).toBe('https://t.example/#token=jwt.a.b&articleId=art-1&revision=3');
    expect(
      externalAppSrc('https://t.example/', 'jwt.a.b', { articleId: undefined })
    ).toBe('https://t.example/#token=jwt.a.b');
  });

  it('replaces an existing fragment', () => {
    expect(externalAppSrc('https://t.example/#old', 'jwt.a.b')).toBe(
      'https://t.example/#token=jwt.a.b'
    );
  });
});

describe('useExternalAppSrc', () => {
  it('does not mint a token without an app', () => {
    const { result } = renderHook(() => useExternalAppSrc(undefined));

    expect(mint).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      src: undefined,
      loading: false,
      error: undefined,
    });
  });

  it('mints once per app and exposes the src', async () => {
    const { result, rerender } = renderHook(
      ({ app }) => useExternalAppSrc(app),
      { initialProps: { app } }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.src).toBeUndefined();

    await waitFor(() =>
      expect(result.current.src).toBe('https://tool.example.com/#token=jwt.a.b')
    );
    expect(result.current.loading).toBe(false);

    rerender({ app });
    rerender({ app: { ...app } });

    expect(mint).toHaveBeenCalledTimes(1);
    expect(mint).toHaveBeenCalledWith({
      variables: { externalAppId: 'app-1' },
    });
  });

  it('mints again when the app changes and never shows the old token on the new url', async () => {
    const { result, rerender } = renderHook(
      ({ app }) => useExternalAppSrc(app),
      { initialProps: { app } }
    );
    await waitFor(() => expect(result.current.src).toBeDefined());

    rerender({ app: { id: 'app-2', url: 'https://other.example.com/' } });

    expect(result.current.src).toBeUndefined();
    expect(result.current.loading).toBe(true);
    await waitFor(() =>
      expect(result.current.src).toBe(
        'https://other.example.com/#token=jwt.a.b'
      )
    );
    expect(mint).toHaveBeenCalledTimes(2);
  });

  it('surfaces the mutation error without a src', async () => {
    mint.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useExternalAppSrc(app));

    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
    expect(result.current.src).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('reports a response without a token as an error', async () => {
    mint.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useExternalAppSrc(app));

    await waitFor(() =>
      expect(result.current.error?.message).toBe('externalApps.noToken')
    );
    expect(result.current.src).toBeUndefined();
  });
});
