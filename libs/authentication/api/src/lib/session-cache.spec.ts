import { type NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import {
  SESSION_CACHE_NAMESPACE,
  SessionCacheInvalidator,
} from './session-cache';

describe('SessionCacheInvalidator', () => {
  it('clears every cached session', async () => {
    const resets = {
      reset: vi.fn().mockResolvedValue(undefined),
    } satisfies Pick<NamespaceResets, 'reset'>;

    await new SessionCacheInvalidator(
      resets as unknown as NamespaceResets
    ).invalidate();

    expect(resets.reset).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
  });
});
