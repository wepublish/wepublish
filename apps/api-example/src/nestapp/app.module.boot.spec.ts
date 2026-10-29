import { generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { type TestingModule, Test } from '@nestjs/testing';
import {
  DistributedClaims,
  DragonflyConnection,
  DragonflyHealth,
} from '@wepublish/dragonfly/api';
import { NamespacedCache, NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PaymentMethodChangeService } from '@wepublish/membership/api';
import { PrismaService } from '@wepublish/nest-modules';
import {
  type AuthorizationState,
  PaymentAuthorizationNotifier,
} from '@wepublish/payment/api';
import { AppModule } from './app.module';
import { createPrismaStub } from './testing/prisma-stub';

const keys = generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const ENV = {
  NODE_ENV: 'production',
  CONFIG_FILE_PATH: join(__dirname, '..', 'default.yaml'),
  HOST_URL: 'http://localhost:4000',
  WEBSITE_URL: 'http://localhost:3000',
  MEDIA_SERVER_URL: 'http://localhost:4100',
  JWT_PRIVATE_KEY: keys.privateKey,
  JWT_PUBLIC_KEY: keys.publicKey,
  REDIS_URL: '',
};

const LIFECYCLE_HOOKS = [
  'onModuleInit',
  'onApplicationBootstrap',
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
];

// What @Cron, @Interval and @Timeout set on the method; @nestjs/schedule does
// not export the constant.
const SCHEDULER_TYPE = 'SCHEDULER_TYPE';

describe('AppModule', () => {
  let module: TestingModule | undefined;

  beforeAll(async () => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));

    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createPrismaStub())
      .compile();
    await module.init();
  }, 60_000);

  afterAll(async () => {
    await module?.close();
    vi.unstubAllEnvs();
  });

  it('resolves the cache and Dragonfly services from the root', () => {
    expect(module?.get(NamespacedCache)).toBeInstanceOf(NamespacedCache);
    expect(module?.get(NamespaceResets)).toBeInstanceOf(NamespaceResets);
    expect(module?.get(DistributedClaims)).toBeInstanceOf(DistributedClaims);
    expect(module?.get(DragonflyHealth)).toBeInstanceOf(DragonflyHealth);
  });

  it('runs without Dragonfly when REDIS_URL is unset', () => {
    expect(module?.get(DragonflyConnection).shared).toBe(false);
  });

  it('registers the website reset listener exactly once', () => {
    expect(module?.get(NamespaceResets).listenerCount()).toBe(1);
  });

  // A provider whose dependency tree reaches a request-scoped dataloader
  // turns request-scoped itself: Nest skips its cron with a warning and never
  // calls its onModuleInit. The unit specs mock the dependencies, so only
  // booting the real modules shows it.
  it('keeps every scheduled or lifecycle-hooked provider out of request scope', () => {
    const scanner = new MetadataScanner();
    const needsSingleton = (prototype: object) =>
      LIFECYCLE_HOOKS.some(hook => hook in prototype) ||
      scanner
        .getAllMethodNames(prototype)
        .some(name =>
          Reflect.hasMetadata(
            SCHEDULER_TYPE,
            (prototype as Record<string, object>)[name]
          )
        );

    const offenders = [...(module?.get(ModulesContainer).values() ?? [])]
      .flatMap(nestModule => [...nestModule.providers.values()])
      .filter(
        wrapper =>
          wrapper.metatype?.prototype &&
          needsSingleton(wrapper.metatype.prototype) &&
          !wrapper.isDependencyTreeStatic()
      )
      .map(wrapper => wrapper.name);

    expect(offenders).toEqual([]);
  });

  it('schedules the nightly periodic job', () => {
    expect(
      module?.get(SchedulerRegistry).getCronJob('periodicJob')
    ).toBeDefined();
  });

  it('hands payment authorizations to the payment method changes', async () => {
    const onAuthorization = vi
      .spyOn(PaymentMethodChangeService.prototype, 'onAuthorization')
      .mockResolvedValue();
    const state: AuthorizationState = {
      changeID: 'change-1',
      state: 'authorized',
    };

    await module?.get(PaymentAuthorizationNotifier).notify('stripe', state);

    expect(onAuthorization).toHaveBeenCalledWith('stripe', state);
    onAuthorization.mockRestore();
  });
});
