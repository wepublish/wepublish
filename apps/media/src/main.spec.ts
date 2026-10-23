import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const order: string[] = [];
  const logger = { name: 'nest-logger' };
  const bootstrap = vi.fn(async () => ({ port: 4100 }));

  return { order, logger, bootstrap };
});

vi.mock('@wepublish/utils/api/otel', () => {
  mocks.order.push('otel');

  return {};
});

vi.mock('@wepublish/utils/api/otel/logger', () => {
  mocks.order.push('nest-logger');

  return { createNestLogger: () => mocks.logger };
});

vi.mock('./instrument', () => {
  mocks.order.push('sentry');

  return {};
});

vi.mock('@nestjs/common', () => {
  mocks.order.push('nest');

  return { Logger: { log: vi.fn() } };
});

vi.mock('./bootstrap', () => {
  mocks.order.push('bootstrap');

  return { bootstrap: mocks.bootstrap };
});

describe('media entry point', () => {
  it('loads otel, then sentry, then the nest logger, and boots with the nest logger', async () => {
    await import('./main');

    expect(mocks.order).toEqual([
      'otel',
      'sentry',
      'nest-logger',
      'nest',
      'bootstrap',
    ]);
    expect(mocks.bootstrap).toHaveBeenCalledWith({ logger: mocks.logger });
  });
});
