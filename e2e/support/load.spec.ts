import { describe, expect, it } from 'vitest';
import { inPool, memoryVerdict, MemorySample, parseLoadReaders } from './load';

const MIB = 1024 * 1024;

const sample = (overrides: Partial<Extract<MemorySample, { hostname: string }>> = {}) =>
  ({
    at: '2026-11-18T10:00:00.000Z',
    hostname: 'api-0',
    uptimeSeconds: 100,
    rssBytes: 300 * MIB,
    heapUsedBytes: 150 * MIB,
    externalBytes: 20 * MIB,
    ...overrides,
  }) satisfies MemorySample;

describe('parseLoadReaders', () => {
  it('reads mail and letter readers', () => {
    expect(parseLoadReaders('1200/300')).toEqual({ mail: 1200, letter: 300 });
    expect(parseLoadReaders(' 40 / 10 ')).toEqual({ mail: 40, letter: 10 });
  });

  it('is off when not set', () => {
    expect(parseLoadReaders(undefined)).toBeUndefined();
    expect(parseLoadReaders('')).toBeUndefined();
  });

  it.each(['1200', '1200/', 'a/b', '-1/3', '0/0'])('refuses "%s"', value => {
    expect(() => parseLoadReaders(value)).toThrow(/E2E_LOAD_READERS/);
  });
});

describe('inPool', () => {
  it('keeps the order and never runs more than the pool size at once', async () => {
    let running = 0;
    let most = 0;

    const results = await inPool([5, 1, 4, 2, 3], 2, async (value, index) => {
      running++;
      most = Math.max(most, running);
      await new Promise(resolve => setTimeout(resolve, value));
      running--;

      return `${index}:${value}`;
    });

    expect(results).toEqual(['0:5', '1:1', '2:4', '3:2', '4:3']);
    expect(most).toBe(2);
  });

  it('fails with the first error once the running calls are done', async () => {
    const started: number[] = [];

    await expect(
      inPool([1, 2, 3, 4], 2, async value => {
        started.push(value);

        if (value === 2) {
          throw new Error('boom');
        }
      })
    ).rejects.toThrow('boom');
    expect(started).not.toContain(4);
  });
});

describe('memoryVerdict', () => {
  const limit = 800 * MIB;

  it('passes a steady process below the limit', () => {
    const verdict = memoryVerdict(
      [
        sample({ uptimeSeconds: 100, rssBytes: 300 * MIB }),
        sample({ uptimeSeconds: 110, rssBytes: 420 * MIB }),
        sample({ uptimeSeconds: 120, rssBytes: 380 * MIB }),
      ],
      limit
    );

    expect(verdict).toMatchObject({ peakRssBytes: 420 * MIB, hostnames: ['api-0'], problems: [] });
  });

  it('tells when the rss came too close to the limit', () => {
    const { problems } = memoryVerdict([sample({ rssBytes: 850 * MIB })], limit);

    expect(problems).toEqual(['rss peaked at 850 MiB, over the 800 MiB allowed (api-0)']);
  });

  it('tells a restart by the uptime starting over', () => {
    const { problems } = memoryVerdict(
      [sample({ uptimeSeconds: 900 }), sample({ uptimeSeconds: 12 })],
      limit
    );

    expect(problems).toEqual(['api-0 restarted (uptime 900 s, then 12 s)']);
  });

  it('tells a restart by a new pod answering', () => {
    const { problems, hostnames } = memoryVerdict(
      [sample({ hostname: 'api-0' }), sample({ hostname: 'api-1', uptimeSeconds: 15 })],
      limit
    );

    expect(hostnames).toEqual(['api-0', 'api-1']);
    expect(problems).toEqual(['a new pod api-1 answered (up 15 s), so a pod restarted or was added']);
  });

  it('tells how long the API did not answer', () => {
    const { problems } = memoryVerdict(
      [
        sample({ at: '2026-11-18T10:00:00.000Z' }),
        { at: '2026-11-18T10:00:10.000Z', error: 'ECONNREFUSED' },
        { at: '2026-11-18T10:00:20.000Z', error: 'ECONNREFUSED' },
        sample({ at: '2026-11-18T10:00:30.000Z', uptimeSeconds: 130 }),
      ],
      limit
    );

    expect(problems).toEqual(['the API did not answer 2 times, first: ECONNREFUSED']);
  });
});
