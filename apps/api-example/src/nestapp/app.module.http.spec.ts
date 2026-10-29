import { generateKeyPairSync } from 'node:crypto';
import { type AddressInfo } from 'node:net';
import { join } from 'node:path';
import { type INestApplication } from '@nestjs/common';
import { NodeAdapter } from '@nestjs/platform-node';
import { type TestingModule, Test } from '@nestjs/testing';
import { PrismaService } from '@wepublish/nest-modules';
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

describe('AppModule over HTTP', () => {
  let module: TestingModule | undefined;
  let app: INestApplication | undefined;
  let base: string;

  beforeAll(async () => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));

    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createPrismaStub())
      .compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.init();
    await app.listen(0);

    const { port } = app.getHttpServer().address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await module?.close();
    vi.unstubAllEnvs();
  });

  it('serves the API on the node:http adapter', () => {
    expect(app?.getHttpAdapter().getType()).toBe('node');
  });

  it('answers a GraphQL query', async () => {
    const res = await fetch(`${base}/v1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      data: { __typename: 'Query' },
    });
  });

  it('routes a REST controller alongside GraphQL', async () => {
    const res = await fetch(`${base}/health`);

    expect(res.status).not.toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      details: { database: expect.anything() },
    });
  });
});
