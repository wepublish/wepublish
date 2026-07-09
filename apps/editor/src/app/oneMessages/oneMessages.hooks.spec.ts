/**
 * @jest-environment jsdom
 */
import { getSettings } from '@wepublish/editor/api';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  fetchOneMessages,
  getMinimized,
  isMinimized,
  setMinimized,
  useOneMessages,
} from './oneMessages.hooks';
import type { OneMessage } from './oneMessages.types';

jest.mock('@wepublish/editor/api', () => ({
  getSettings: jest.fn(),
}));

const mockedGetSettings = getSettings as jest.Mock;

const message = (overrides: Partial<OneMessage> = {}): OneMessage => ({
  id: 1,
  severity: 'info',
  title: 'Title',
  body: null,
  link_label: null,
  link_url: null,
  dismissible: false,
  starts_at: null,
  ends_at: null,
  ...overrides,
});

const mockFetch = (impl: () => unknown) => {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
};

const okResponse = (data: unknown) => ({
  ok: true,
  json: async () => data,
});

beforeEach(() => {
  delete process.env.WEP_ONE_URL;
  delete process.env.APP_NAME;
  mockedGetSettings.mockReturnValue({
    wepOneURL: 'https://one.test/',
    medium: 'BAJOUR',
  });
  localStorage.clear();
});

describe('fetchOneMessages', () => {
  it('returns the data array on a 200 response', async () => {
    const data = [message({ id: 7 })];
    mockFetch(() => Promise.resolve(okResponse({ data })));

    await expect(fetchOneMessages('de')).resolves.toEqual(data);
  });

  it('sends a lowercased medium and the locale, with the trailing slash stripped', async () => {
    mockFetch(() => Promise.resolve(okResponse({ data: [] })));

    await fetchOneMessages('fr');

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toBe('https://one.test/messages?medium=bajour&locale=fr');
  });

  it('omits the medium param when no medium is configured', async () => {
    mockedGetSettings.mockReturnValue({ wepOneURL: 'https://one.test' });
    mockFetch(() => Promise.resolve(okResponse({ data: [] })));

    await fetchOneMessages('de');

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toBe('https://one.test/messages?locale=de');
  });

  it('omits the locale param when locale is empty', async () => {
    mockFetch(() => Promise.resolve(okResponse({ data: [] })));

    await fetchOneMessages('');

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toBe('https://one.test/messages?medium=bajour');
  });

  it('resolves to an empty list on a non-200 response', async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 500 }));

    await expect(fetchOneMessages('de')).resolves.toEqual([]);
  });

  it('resolves to an empty list when the request throws', async () => {
    mockFetch(() => Promise.reject(new Error('network down')));

    await expect(fetchOneMessages('de')).resolves.toEqual([]);
  });

  it('resolves to an empty list when data is not an array', async () => {
    mockFetch(() => Promise.resolve(okResponse({ data: null })));

    await expect(fetchOneMessages('de')).resolves.toEqual([]);
  });
});

describe('minimize helpers', () => {
  it('persists minimized ids and reads them back', () => {
    setMinimized(3, true);
    setMinimized(9, true);

    expect(getMinimized()).toEqual([3, 9]);
  });

  it('does not store the same id twice', () => {
    setMinimized(3, true);
    setMinimized(3, true);

    expect(getMinimized()).toEqual([3]);
  });

  it('removes an id again when expanded', () => {
    setMinimized(3, true);
    setMinimized(3, false);

    expect(getMinimized()).toEqual([]);
  });

  it('reports minimized only for dismissible messages that were minimized', () => {
    setMinimized(3, true);

    expect(isMinimized(message({ id: 3, dismissible: true }))).toBe(true);
    expect(isMinimized(message({ id: 3, dismissible: false }))).toBe(false);
    expect(isMinimized(message({ id: 4, dismissible: true }))).toBe(false);
  });

  it('treats corrupt storage as nothing minimized', () => {
    localStorage.setItem('wep-one-minimized-messages', 'not json');

    expect(getMinimized()).toEqual([]);
  });
});

describe('useOneMessages', () => {
  it('loads and returns the fetched messages', async () => {
    const data = [message({ id: 42 })];
    mockFetch(() => Promise.resolve(okResponse({ data })));

    const { result } = renderHook(() => useOneMessages('de'));

    await waitFor(() => expect(result.current).toEqual(data));
  });

  it('removes the focus listener on unmount', async () => {
    mockFetch(() => Promise.resolve(okResponse({ data: [] })));
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOneMessages('de'));
    await act(async () => {
      await Promise.resolve();
    });
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    removeSpy.mockRestore();
  });
});
