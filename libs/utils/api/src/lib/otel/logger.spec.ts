import { ConsoleLogger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ startNodeOtel: vi.fn() }));

vi.mock('./start', () => ({ startNodeOtel: mocks.startNodeOtel }));

const load = () => import('./logger');

const jsonOption = (logger: unknown) =>
  (logger as { options: { json?: boolean } }).options.json;

describe('nest logger entry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns no logger outside production when otel is off', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');

    const { createNestLogger } = await load();

    expect(createNestLogger({ NODE_ENV: 'development' })).toBeUndefined();
  });

  it('returns a json console logger in production when otel is off', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');

    const { createNestLogger } = await load();
    const logger = createNestLogger({ NODE_ENV: 'production' });

    expect(logger?.constructor).toBe(ConsoleLogger);
    expect(jsonOption(logger)).toBe(true);
  });

  it('returns a json console logger in production when logs are not exported', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_LOGS_EXPORTER', 'none');

    const { createNestLogger } = await load();
    const logger = createNestLogger({ NODE_ENV: 'production' });

    expect(logger?.constructor).toBe(ConsoleLogger);
    expect(jsonOption(logger)).toBe(true);
  });

  it('returns no logger outside production when logs are not exported', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_LOGS_EXPORTER', 'none');

    const { createNestLogger } = await load();

    expect(createNestLogger({})).toBeUndefined();
  });

  it('returns the pretty otel console logger outside production when logs are exported', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_LOGS_EXPORTER', '');

    const { createNestLogger } = await load();
    const logger = createNestLogger({ NODE_ENV: 'development' });

    expect(logger?.constructor.name).toBe('OtelConsoleLogger');
    expect(jsonOption(logger)).toBeFalsy();
  });

  it('returns the json otel console logger in production when logs are exported', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
    vi.stubEnv('OTEL_LOGS_EXPORTER', '');

    const { createNestLogger } = await load();
    const logger = createNestLogger({ NODE_ENV: 'production' });

    expect(logger?.constructor.name).toBe('OtelConsoleLogger');
    expect(jsonOption(logger)).toBe(true);
  });

  it('reads NODE_ENV from process.env by default', async () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    vi.stubEnv('NODE_ENV', 'production');

    const { createNestLogger } = await load();

    expect(jsonOption(createNestLogger())).toBe(true);
  });
});
