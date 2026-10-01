import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KvTtlCacheModule } from './kv-ttl-cache.module';
import { KvTtlCacheService } from './kv-ttl-cache.service';

describe('KvTtlCacheModule', () => {
  const originalEnv = { ...process.env };
  let module: TestingModule | undefined;

  const createService = async () => {
    module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    await module.init();

    return module.get(KvTtlCacheService);
  };

  afterEach(async () => {
    await module?.close();
    module = undefined;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('does not see the REDIS_URL that nx loads from .env', () => {
    expect(originalEnv['REDIS_URL']).toBeUndefined();
    expect(originalEnv['REDIS_KEY_PREFIX']).toBeUndefined();
  });

  it('caches in memory when REDIS_URL is not set', async () => {
    delete process.env['REDIS_URL'];
    delete process.env['REDIS_KEY_PREFIX'];
    const service = await createService();
    const loader = vi.fn().mockResolvedValue('loaded');

    await service.getOrLoad('key', loader, 60);
    const second = await service.getOrLoad('key', loader, 60);

    expect(second).toBe('loaded');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('treats an unreachable Dragonfly as a cache miss and logs it', async () => {
    process.env['REDIS_URL'] = 'redis://wepublish-test:secret@127.0.0.1:1/0';
    process.env['REDIS_KEY_PREFIX'] = 'wepublish-test';
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const service = await createService();
    const startedAt = Date.now();

    await expect(service.getOrLoad('key', () => 'loaded', 60)).resolves.toBe(
      'loaded'
    );
    await expect(service.getOrLoad('key', () => 'again', 60)).resolves.toBe(
      'again'
    );
    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(logged).toHaveBeenCalled();
  });
});
