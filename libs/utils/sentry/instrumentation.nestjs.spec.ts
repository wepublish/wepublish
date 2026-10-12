import type { Integration } from '@sentry/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.hoisted(() => vi.fn());

vi.mock('@sentry/nestjs', () => ({
  init,
  setTag: vi.fn(),
  prismaIntegration: () => ({ name: 'Prisma' }),
}));

vi.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: () => ({ name: 'ProfilingNode' }),
}));

const initOptions = async () => {
  await import('./instrumentation.nestjs');

  return init.mock.calls.at(-1)?.[0] ?? {};
};

describe('nestjs sentry instrumentation', () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
  });

  it('adds profiling and prisma, and drops the redis key spans', async () => {
    const { integrations } = await initOptions();
    const resolved = (
      integrations as (defaults: Integration[]) => Integration[]
    )([{ name: 'Http' }, { name: 'Redis' }] as Integration[]);

    expect(resolved.map(integration => integration.name)).toEqual([
      'Http',
      'ProfilingNode',
      'Prisma',
    ]);
  });

  // `profilesSampleRate` was removed in @sentry/node 11; profiling is now
  // driven by a session sample rate plus a lifecycle.
  it('configures profiling through the session options', async () => {
    const options = await initOptions();

    expect(options).not.toHaveProperty('profilesSampleRate');
    expect(options.profileLifecycle).toBe('trace');
    expect(options.profileSessionSampleRate).toBe(1.0);
  });
});
