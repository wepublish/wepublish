import { Logger } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';
import { DragonflyHealth } from './dragonfly-health';
import { type DragonflyOptions } from './dragonfly-options';
import { type DragonflyReply } from './dragonfly-reply';
import { MemoryDragonflyConnection } from './memory-dragonfly-connection';
import { FakeDragonfly } from './testing/fake-dragonfly';

class PausedDragonfly extends FakeDragonfly {
  override isAvailable() {
    return false;
  }

  override async set(): Promise<DragonflyReply<boolean>> {
    return { ok: false, reason: 'unavailable' };
  }

  override async probe() {
    return true;
  }
}

const options: DragonflyOptions = {
  url: 'rediss://dragonfly',
  keyPrefix: 'wepublish-test',
  production: true,
  releaseId: 'dev',
};

const healthOf = (
  connection: DragonflyConnection,
  overrides: Partial<DragonflyOptions> = {}
) => new DragonflyHealth(connection, { ...options, ...overrides });

describe('DragonflyHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('status', () => {
    it('reports Dragonfly reachable while it answers', async () => {
      await expect(healthOf(new FakeDragonfly()).status()).resolves.toBe(
        'reachable'
      );
    });

    it('reports Dragonfly unreachable while it does not answer', async () => {
      const dragonfly = new FakeDragonfly();
      dragonfly.down();

      await expect(healthOf(dragonfly).status()).resolves.toBe('unreachable');
    });

    it('reports Dragonfly reachable when it answers the probe, even while this replica still pauses its other commands after a slow answer', async () => {
      await expect(healthOf(new PausedDragonfly()).status()).resolves.toBe(
        'reachable'
      );
    });

    it('reports Dragonfly unreachable when it answers but refuses writes, like a wrong prefix or a full Dragonfly', async () => {
      const dragonfly = new FakeDragonfly();
      dragonfly.rejectNext('SET');

      await expect(healthOf(dragonfly).status()).resolves.toBe('unreachable');
    });

    it('reports a missing REDIS_URL', async () => {
      await expect(
        healthOf(new MemoryDragonflyConnection()).status()
      ).resolves.toBe('not-configured');
    });

    it('writes the health key with a minute to live', async () => {
      const dragonfly = new FakeDragonfly();

      await healthOf(dragonfly).status();

      expect(dragonfly.commands).toEqual([
        ['SET', 'health', expect.stringMatching(/^\d+$/), 'PX', '60000'],
      ]);
    });
  });

  describe('bootCheck', () => {
    it('writes the health key once, however often it is asked', async () => {
      const dragonfly = new FakeDragonfly();
      const health = healthOf(dragonfly);

      await expect(health.bootCheck()).resolves.toBe(true);
      await expect(health.bootCheck()).resolves.toBe(true);

      expect(dragonfly.commands).toEqual([
        ['SET', 'health', expect.stringMatching(/^\d+$/), 'PX', '60000'],
      ]);
    });

    it('fails while this replica pauses its commands, unlike the probe', async () => {
      await expect(healthOf(new PausedDragonfly()).bootCheck()).resolves.toBe(
        false
      );
    });

    it('passes without Dragonfly, where every replica only sees itself', async () => {
      await expect(
        healthOf(new MemoryDragonflyConnection()).bootCheck()
      ).resolves.toBe(true);
    });
  });

  describe('at boot', () => {
    it('warns when REDIS_URL is missing in production', async () => {
      const warned = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await healthOf(new MemoryDragonflyConnection(), {
        url: undefined,
      }).onModuleInit();

      expect(warned).toHaveBeenCalledWith(expect.stringContaining('REDIS_URL'));
    });

    it('stays quiet without REDIS_URL outside production', async () => {
      const warned = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await healthOf(new MemoryDragonflyConnection(), {
        url: undefined,
        production: false,
      }).onModuleInit();

      expect(warned).not.toHaveBeenCalled();
    });

    it('reports when Dragonfly cannot be reached', async () => {
      const failed = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const dragonfly = new FakeDragonfly();
      dragonfly.down();

      await healthOf(dragonfly).onModuleInit();

      expect(failed).toHaveBeenCalledWith(
        expect.stringContaining('not reachable at boot')
      );
    });

    it('reports nothing when Dragonfly answers', async () => {
      const failed = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      await healthOf(new FakeDragonfly()).onModuleInit();

      expect(failed).not.toHaveBeenCalled();
    });
  });
});
