import { OneChannelStateService } from './one-channel-state.service';
import { OneClientService } from './one-client.service';
import {
  BOOTSTRAP_DELAY_MS,
  OneHeartbeatService,
  sanitiseVersion,
} from './one-heartbeat.service';
import type { Mock } from 'vitest';
import type { Feature } from '@wepublish/features';
import type { FeaturesService } from '@wepublish/features/api';

describe('sanitiseVersion', () => {
  it('accepts a git sha', () => {
    expect(sanitiseVersion('890550c1f2e3')).toBe('890550c1f2e3');
  });

  it('accepts a semver tag', () => {
    expect(sanitiseVersion('v6.1.1')).toBe('v6.1.1');
  });

  it('trims surrounding whitespace and newlines', () => {
    expect(sanitiseVersion('  890550c\n')).toBe('890550c');
  });

  it('refuses anything with characters a version cannot contain', () => {
    expect(sanitiseVersion('890550c\nX-Injected: 1')).toBe('unknown');
    expect(sanitiseVersion('../../etc/passwd')).toBe('unknown');
    expect(sanitiseVersion('sha; rm -rf /')).toBe('unknown');
  });

  it('refuses an absurdly long value', () => {
    expect(sanitiseVersion('a'.repeat(65))).toBe('unknown');
  });

  it('refuses an empty file', () => {
    expect(sanitiseVersion('')).toBe('unknown');
    expect(sanitiseVersion('   ')).toBe('unknown');
  });
});

describe('OneHeartbeatService', () => {
  let client: { post: Mock };
  let state: { recordSuccess: Mock; recordFailure: Mock };
  let features: { apply: Mock };

  const registry: readonly Feature[] = [
    { key: 'newsletter', description: 'Newsletter editor', stage: 'alpha' },
  ];

  function makeService(oneURL: string) {
    return new OneHeartbeatService(
      client as unknown as OneClientService,
      state as unknown as OneChannelStateService,
      oneURL,
      features as unknown as FeaturesService,
      registry
    );
  }

  beforeEach(() => {
    client = { post: vi.fn().mockResolvedValue(undefined) };
    state = {
      recordSuccess: vi.fn().mockResolvedValue(undefined),
      recordFailure: vi.fn(),
    };
    features = { apply: vi.fn().mockResolvedValue(undefined) };
  });

  it('does nothing when WEP_ONE_URL is not configured', async () => {
    await makeService('').send();

    expect(client.post).not.toHaveBeenCalled();
    expect(state.recordSuccess).not.toHaveBeenCalled();
    expect(state.recordFailure).not.toHaveBeenCalled();
  });

  it('posts a heartbeat and records the success', async () => {
    await makeService('https://one.wepublish.ch').send();

    expect(client.post).toHaveBeenCalledWith(
      '/channel/heartbeat',
      'write:medium-heartbeat',
      expect.objectContaining({ version: expect.any(String) })
    );
    expect(state.recordSuccess).toHaveBeenCalled();
  });

  it('records a failure instead of throwing when One is unreachable', async () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      makeService('https://one.wepublish.ch').send()
    ).resolves.toBeUndefined();

    expect(state.recordFailure).toHaveBeenCalledWith(
      expect.any(Date),
      'ECONNREFUSED'
    );
  });

  it('does not send at bootstrap, because the HTTP server is not listening yet', () => {
    vi.useFakeTimers();

    try {
      makeService('https://one.wepublish.ch').onApplicationBootstrap();

      expect(client.post).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('schedules the first heartbeat past the bootstrap delay', () => {
    const scheduled: number[] = [];
    const original = global.setTimeout;
    global.setTimeout = ((fn: () => void, ms?: number) => {
      scheduled.push(ms ?? 0);
      return original(() => undefined, 0);
    }) as unknown as typeof global.setTimeout;

    try {
      makeService('https://one.wepublish.ch').onApplicationBootstrap();

      expect(scheduled).toContain(BOOTSTRAP_DELAY_MS);
      expect(BOOTSTRAP_DELAY_MS).toBeGreaterThan(0);
    } finally {
      global.setTimeout = original;
    }
  });

  it('does not throw out of application bootstrap', () => {
    client.post.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(() =>
      makeService('https://one.wepublish.ch').onApplicationBootstrap()
    ).not.toThrow();
  });

  it('tells One which features this version can switch', async () => {
    await makeService('https://one.wepublish.ch').send();

    expect(client.post).toHaveBeenCalledWith(
      '/channel/heartbeat',
      'write:medium-heartbeat',
      expect.objectContaining({
        features: [
          {
            key: 'newsletter',
            description: 'Newsletter editor',
            stage: 'alpha',
          },
        ],
      })
    );
  });

  it('stores the features One answers with', async () => {
    client.post.mockResolvedValue({ features: { newsletter: true } });

    await makeService('https://one.wepublish.ch').send();

    expect(features.apply).toHaveBeenCalledWith({ newsletter: true });
  });

  it('keeps the stored features when One answers without any', async () => {
    client.post.mockResolvedValue(undefined);

    await makeService('https://one.wepublish.ch').send();

    expect(features.apply).not.toHaveBeenCalled();
  });

  it('ignores features that are not a key → on/off map', async () => {
    client.post.mockResolvedValue({ features: ['newsletter'] });
    await makeService('https://one.wepublish.ch').send();

    client.post.mockResolvedValue({ features: null });
    await makeService('https://one.wepublish.ch').send();

    expect(features.apply).not.toHaveBeenCalled();
  });

  it('still counts the heartbeat as delivered when storing the features fails', async () => {
    client.post.mockResolvedValue({ features: { newsletter: true } });
    features.apply.mockRejectedValue(new Error('db down'));

    await expect(
      makeService('https://one.wepublish.ch').send()
    ).resolves.toBeUndefined();

    expect(state.recordSuccess).toHaveBeenCalled();
    expect(state.recordFailure).not.toHaveBeenCalled();
  });
});
