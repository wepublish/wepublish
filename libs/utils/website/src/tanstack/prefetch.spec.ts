import {
  NavigationListDocument,
  PeerProfileDocument,
  WebsiteSettingsDocument,
} from '@wepublish/website/api';
import type { ApolloClient } from '@apollo/client';
import { prefetchShared } from './prefetch';

const clientReturning = (websiteSettings: unknown) => {
  const query = vi.fn(async ({ query: document }) =>
    document === WebsiteSettingsDocument ?
      { data: { websiteSettings } }
    : { data: {} }
  );

  return { client: { query } as unknown as ApolloClient, query };
};

describe('prefetchShared', () => {
  it('returns the website settings the root loader renders from', async () => {
    const { client } = clientReturning({ id: 'settings-1' });

    await expect(prefetchShared(client)).resolves.toEqual({ id: 'settings-1' });
  });

  it('warms every query a page needs, not just the one it returns', async () => {
    const { client, query } = clientReturning({});

    await prefetchShared(client);

    expect(query.mock.calls.map(([{ query: document }]) => document)).toEqual(
      expect.arrayContaining([
        WebsiteSettingsDocument,
        NavigationListDocument,
        PeerProfileDocument,
      ])
    );
  });

  it('issues them concurrently rather than one after another', async () => {
    let inFlight = 0;
    let peak = 0;
    const query = vi.fn(async () => {
      peak = Math.max(peak, ++inFlight);
      await Promise.resolve();
      inFlight--;

      return { data: {} };
    });

    await prefetchShared({ query } as unknown as ApolloClient);

    expect(peak).toBe(4);
  });

  it('yields undefined when the query came back without data', async () => {
    const query = vi.fn(async () => ({}));

    await expect(
      prefetchShared({ query } as unknown as ApolloClient)
    ).resolves.toBeUndefined();
  });
});
