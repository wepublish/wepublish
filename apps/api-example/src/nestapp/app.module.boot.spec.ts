import { generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import { type TestingModule, Test } from '@nestjs/testing';
import {
  DistributedClaims,
  DragonflyConnection,
  DragonflyHealth,
} from '@wepublish/dragonfly/api';
import { NamespacedCache, NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { PrismaService } from '@wepublish/nest-modules';
import { AppModule } from './app.module';

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

const resultFor = (method: string) => {
  if (method === 'findMany' || method === 'groupBy') {
    return [];
  }

  if (method === 'count') {
    return 0;
  }

  return null;
};

const createPrisma = (): PrismaService => {
  const models = new Map<string, unknown>();
  const prisma: object = new Proxy(
    {},
    {
      get: (_target, property) => {
        if (typeof property !== 'string' || property === 'then') {
          return undefined;
        }

        if (property === '$transaction') {
          return async (work: unknown) =>
            typeof work === 'function' ?
              work(prisma)
            : Promise.all(work as Promise<unknown>[]);
        }

        if (property.startsWith('$')) {
          return async () => [];
        }

        if (!models.has(property)) {
          models.set(
            property,
            new Proxy(
              {},
              {
                get: (_model, method) =>
                  typeof method === 'string' && method !== 'then' ?
                    async () => resultFor(method)
                  : undefined,
              }
            )
          );
        }

        return models.get(property);
      },
    }
  );

  return prisma as PrismaService;
};

describe('AppModule', () => {
  let module: TestingModule | undefined;

  beforeAll(async () => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));

    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createPrisma())
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
});
