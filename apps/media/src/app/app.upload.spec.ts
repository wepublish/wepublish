import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NodeAdapter } from '@nestjs/platform-node';
import { type AddressInfo } from 'node:net';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { JwtAuthGuard, MediaService } from '@wepublish/media/api';
import { AppModule } from './app.module';

const ENV = {
  S3_ENDPOINT: 's3.example',
  S3_PORT: '443',
  S3_ACCESS_KEY: 'access',
  S3_SECRET_KEY: 'secret',
  S3_PUBLIC_HOST: 'https://media.example',
  API_URL: 'https://api.example',
  APP_RELEASE_ID: '2026.10.1',
};

describe('AppController uploads over HTTP', () => {
  let app: INestApplication | undefined;
  let saveImage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    Object.entries(ENV).forEach(([name, value]) => vi.stubEnv(name, value));
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.unstubAllEnvs();
  });

  const start = async () => {
    saveImage = vi
      .fn()
      .mockResolvedValue({ size: 1234, format: 'png', width: 10, height: 20 });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DragonflyConnection)
      .useValue(new FakeDragonfly())
      .overrideProvider(MediaService)
      .useValue({ saveImage })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.init();
    await app.listen(0);

    const { port } = app.getHttpServer().address() as AddressInfo;

    return `http://127.0.0.1:${port}`;
  };

  it('runs on the node:http adapter', async () => {
    await start();

    expect(app?.getHttpAdapter().getType()).toBe('node');
  });

  it('parses a multipart upload and hands the buffer to the media service', async () => {
    const base = await start();
    const body = new FormData();
    body.append(
      'file',
      new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' }),
      'logo.png'
    );

    const res = await fetch(`${base}/?imageId=image-1`, {
      method: 'POST',
      body,
    });

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      id: 'image-1',
      fileSize: 1234,
      mimeType: 'image/png',
      width: 10,
      height: 20,
    });
    expect(saveImage).toHaveBeenCalledWith(
      'image-1',
      Buffer.from([1, 2, 3, 4])
    );
  });

  it('rejects a file whose type the image validator does not support', async () => {
    const base = await start();
    const body = new FormData();
    body.append(
      'file',
      new Blob([new Uint8Array([1])], { type: 'application/zip' }),
      'bundle.zip'
    );

    const res = await fetch(`${base}/?imageId=image-1`, {
      method: 'POST',
      body,
    });

    expect(res.status).toBe(400);
    expect(saveImage).not.toHaveBeenCalled();
  });
});
