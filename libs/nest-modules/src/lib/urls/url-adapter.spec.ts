import { URLAdapter } from './url-adapter';

describe('URLAdapter.getEventURL', () => {
  const adapter = new URLAdapter('https://example.com ');

  it('links an event by its slug', async () => {
    expect(await adapter.getEventURL({ id: 'event-1', slug: 'konzert' })).toBe(
      'https://example.com/event/konzert'
    );
  });

  it('falls back to the id route without a slug', async () => {
    expect(await adapter.getEventURL({ id: 'event-1', slug: null })).toBe(
      'https://example.com/event/id/event-1'
    );
  });
});
