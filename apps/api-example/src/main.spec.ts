import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const order: string[] = [];
  const app = {
    enableCors: vi.fn(),
    use: vi.fn(),
    listen: vi.fn(async () => undefined),
  };
  const create = vi.fn(async () => app);
  const createNestLogger = vi.fn();

  return { order, app, create, createNestLogger };
});

vi.mock('@wepublish/utils/api/otel', () => {
  mocks.order.push('otel');

  return {};
});

vi.mock('@wepublish/utils/api/otel/logger', () => {
  mocks.order.push('nest-logger');

  return { createNestLogger: mocks.createNestLogger };
});

vi.mock('@wepublish/utils/api/sentry', () => {
  mocks.order.push('sentry');

  return {};
});

vi.mock('@nestjs/core', () => {
  mocks.order.push('nest');

  return { NestFactory: { create: mocks.create } };
});

vi.mock('@nestjs/common', () => ({ Logger: { log: vi.fn(), error: vi.fn() } }));
vi.mock('./nestapp/app.module', () => ({ AppModule: class AppModule {} }));
vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn() }));
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: vi.fn() }));
vi.mock('../prisma/seed', () => ({ runExampleSeed: vi.fn() }));
vi.mock('@wepublish/mail/api', () => ({ MAIL_WEBHOOK_PATH_PREFIX: 'mail' }));
vi.mock('@wepublish/payment/api', () => ({
  PAYMENT_WEBHOOK_PATH_PREFIX: 'payment',
}));
vi.mock('@wepublish/utils/api', () => ({ MAX_PAYLOAD_SIZE: '1mb' }));
vi.mock('helmet', () => ({ default: vi.fn(() => 'helmet') }));
vi.mock('body-parser', () => ({
  json: vi.fn(() => vi.fn()),
  urlencoded: vi.fn(() => 'urlencoded'),
}));
vi.mock('graphql-upload', () => ({
  graphqlUploadExpress: vi.fn(() => 'upload'),
}));

const boot = async () => {
  await import('./main');
  await vi.waitFor(() => expect(mocks.app.listen).toHaveBeenCalled());

  return mocks.create.mock.calls.at(-1) as unknown as [unknown, object];
};

describe('api entry point', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.order.length = 0;
  });

  it('loads otel, then sentry, then the nest logger and nest', async () => {
    mocks.createNestLogger.mockReturnValue(undefined);

    await boot();

    expect(mocks.order).toEqual(['otel', 'sentry', 'nest-logger', 'nest']);
  });

  it('keeps the nest options unchanged when there is no logger', async () => {
    mocks.createNestLogger.mockReturnValue(undefined);

    const [, options] = await boot();

    expect(options).toEqual({ bodyParser: false });
  });

  it('hands the logger to nest when there is one', async () => {
    const logger = { name: 'nest-logger' };
    mocks.createNestLogger.mockReturnValue(logger);

    const [, options] = await boot();

    expect(options).toEqual({ bodyParser: false, logger });
  });
});
