import type { Integration } from '@sentry/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.hoisted(() => vi.fn());

vi.mock('@sentry/nestjs', () => ({
  init,
  setTag: vi.fn(),
  prismaIntegration: () => ({ name: 'Prisma' }),
  openTelemetryIntegration: () => ({ name: 'OpenTelemetry' }),
}));

vi.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: () => ({ name: 'ProfilingNode' }),
}));

const initOptions = async () => {
  await import('./instrumentation');

  return init.mock.calls.at(-1)?.[0] ?? {};
};

describe('nestjs sentry instrumentation', () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const integrationNames = async () => {
    const options = await initOptions();
    const resolved = (
      options.integrations as (defaults: Integration[]) => Integration[]
    )([{ name: 'Http' }] as Integration[]);

    return { options, names: resolved.map(integration => integration.name) };
  };

  it("keeps today's integrations when otel is off", async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    const { options, names } = await integrationNames();

    expect(names).toEqual(['Http', 'ProfilingNode', 'Prisma']);
    expect(options).not.toHaveProperty('enableOpenTelemetrySetup');
  });

  it('links sentry events to otel spans when otel is on', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    const { options, names } = await integrationNames();

    expect(names).toEqual(['Http', 'ProfilingNode', 'Prisma', 'OpenTelemetry']);
    expect(options).not.toHaveProperty('enableOpenTelemetrySetup');
  });

  it('adds profiling and prisma, and drops the redis key spans', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
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
