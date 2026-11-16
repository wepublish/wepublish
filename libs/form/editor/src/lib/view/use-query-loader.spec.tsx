import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook } from '@testing-library/react';
import { ConsentDocument } from '@wepublish/editor/api';
import type { ReactNode } from 'react';

import { useQueryLoader } from './use-query-loader';

vi.mock('node-fetch', () => ({ default: vi.fn() }));

const consent = (name: string) => ({
  __typename: 'Consent' as const,
  id: 'consent-1',
  name,
  slug: 'newsletter',
  defaultValue: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
});

const loadMock = (name: string) => ({
  request: { query: ConsentDocument, variables: { id: 'consent-1' } },
  result: { data: { consent: consent(name) } },
});

const renderLoader = (mocks: object[]) =>
  renderHook(
    () =>
      useQueryLoader(
        ConsentDocument,
        { id: 'consent-1' },
        data => data.consent
      ),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks as never}>{children}</MockedProvider>
      ),
    }
  );

describe('useQueryLoader', () => {
  it('selects the loaded record', async () => {
    const { result } = renderLoader([loadMock('Newsletter')]);

    await expect(result.current()).resolves.toMatchObject({
      name: 'Newsletter',
    });
  });

  it('asks the network again on every call instead of the cache', async () => {
    const { result } = renderLoader([
      loadMock('Newsletter'),
      loadMock('Newsletter weekly'),
    ]);

    await expect(result.current()).resolves.toMatchObject({
      name: 'Newsletter',
    });
    await expect(result.current()).resolves.toMatchObject({
      name: 'Newsletter weekly',
    });
  });

  it('rejects when the query returns no data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { result } = renderLoader([
      {
        request: { query: ConsentDocument, variables: { id: 'consent-1' } },
        result: { data: null },
      },
    ]);

    await expect(result.current()).rejects.toEqual(new Error(''));
    expect([...warn.mock.calls, ...error.mock.calls].join(' ')).toMatch(
      /partial result/
    );

    warn.mockRestore();
    error.mockRestore();
  });

  it('rejects when the query fails', async () => {
    const { result } = renderLoader([
      {
        request: { query: ConsentDocument, variables: { id: 'consent-1' } },
        error: new Error('Server down'),
      },
    ]);

    await expect(result.current()).rejects.toThrow('Server down');
  });
});
