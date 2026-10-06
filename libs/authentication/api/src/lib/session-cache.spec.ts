import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  SESSION_CACHE_NAMESPACE,
  SessionCacheInvalidator,
} from './session-cache';

describe('SessionCacheInvalidator', () => {
  it('clears every cached session', async () => {
    const kv = { resetNamespace: vi.fn().mockResolvedValue(undefined) };

    await new SessionCacheInvalidator(
      kv as unknown as KvTtlCacheService
    ).invalidate();

    expect(kv.resetNamespace).toHaveBeenCalledWith(SESSION_CACHE_NAMESPACE);
  });
});
