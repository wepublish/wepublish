import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { MediaService } from '@wepublish/media/api';
import { AppController } from './app.controller';
import { AppModule } from './app.module';
import { NodeAdapter } from '@nestjs/platform-node';

const ENV = {
  S3_ENDPOINT: 's3.example',
  S3_PORT: '443',
  S3_ACCESS_KEY: 'access',
  S3_SECRET_KEY: 'secret',
  S3_PUBLIC_HOST: 'https://media.example',
  API_URL: 'https://api.example',
  APP_RELEASE_ID: '2026.10.1',
};

const createResponse = () => {
  const res = {
    setHeader: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn(),
    send: vi.fn(),
  };
  res.status.mockReturnValue(res);

  return res;
};

describe('AppModule', () => {
  let app: INestApplication | undefined;

  beforeEach(() => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const start = async (dragonfly: FakeDragonfly) => {
    const media = {
      getImageUri: vi
        .fn()
        .mockResolvedValue({ uri: 'images/image-1/{}', exists: true }),
    } satisfies Pick<MediaService, 'getImageUri'>;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DragonflyConnection)
      .useValue(dragonfly)
      .overrideProvider(MediaService)
      .useValue(media)
      .compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.init();

    return app;
  };

  it('serves a link through the shared link cache', async () => {
    const dragonfly = new FakeDragonfly();
    const started = await start(dragonfly);

    await started
      .get(AppController)
      .transformImage(
        createResponse() as unknown as NodeResponse,
        { url: '/v1/image-1' } as unknown as NodeRequest,
        'image-1',
        {}
      );

    expect(dragonfly.commands).toContainEqual([
      'SET',
      expect.stringMatching(/^val:media:links:[0-9a-f]{64}$/),
      expect.any(String),
      'PX',
      expect.any(String),
    ]);
  });

  it('runs none of the API website signalling while booting and serving links', async () => {
    const dragonfly = new FakeDragonfly();
    const started = await start(dragonfly);

    await started
      .get(AppController)
      .transformImage(
        createResponse() as unknown as NodeResponse,
        { url: '/v1/image-1' } as unknown as NodeRequest,
        'image-1',
        {}
      );
    await started.close();
    app = undefined;

    const keys = dragonfly.commands.flatMap(([command, ...args]) =>
      command === 'MGET' || command === 'DEL' ? args : [args[0]]
    );
    expect(keys).not.toContain('website:heartbeat');
    expect(keys).not.toContain('release:current');
    expect(keys.filter(key => key.startsWith('nsv:'))).toEqual([]);
  });
});
