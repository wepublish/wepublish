import { afterEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import {
  DragonflyTestingModule,
  FakeDragonfly,
} from '@wepublish/dragonfly/api/testing';
import { KvCacheModule } from '@wepublish/kv-ttl-cache/api';
import {
  LinkCache,
  MediaLinkCacheModule,
  MediaService,
} from '@wepublish/media/api';
import { AppController } from './app.controller';

const FALLBACK_URL = 'https://fallback.example';

const createResponse = () => {
  const res = {
    setHeader: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn(),
    send: vi.fn(),
    sendStatus: vi.fn(),
  };
  res.status.mockReturnValue(res);

  return res;
};

const modules: TestingModule[] = [];

afterEach(async () => {
  await Promise.all(modules.splice(0).map(module => module.close()));
});

const createLinkCache = async (dragonfly: FakeDragonfly) => {
  const module = await Test.createTestingModule({
    imports: [
      DragonflyTestingModule.forRoot({ connection: dragonfly }),
      KvCacheModule.forRoot(),
      MediaLinkCacheModule,
    ],
  }).compile();

  modules.push(module);

  return module.get(LinkCache);
};

const valueWrites = (dragonfly: FakeDragonfly) =>
  dragonfly.commands.filter(
    ([command, key]) => command === 'SET' && key.startsWith('val:')
  );

const createController = async (
  media: Partial<Record<keyof MediaService, unknown>>,
  fallbackUrl?: string,
  dragonfly = new FakeDragonfly()
) =>
  new AppController(
    media as unknown as MediaService,
    await createLinkCache(dragonfly),
    { get: () => fallbackUrl } as unknown as ConfigService
  );

const request = (url: string) => ({ url }) as unknown as NodeRequest;

describe('AppController images', () => {
  it('does not write the shared cache again when a link is found', async () => {
    const dragonfly = new FakeDragonfly();
    const media = {
      getImageUri: vi
        .fn()
        .mockResolvedValue({ uri: 'images/image-1/{}', exists: true }),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
    const controller = await createController(media, undefined, dragonfly);

    for (let i = 0; i < 3; i++) {
      await controller.transformImage(
        createResponse() as unknown as NodeResponse,
        request('/v1/image-1'),
        'image-1',
        {}
      );
    }

    expect(valueWrites(dragonfly)).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it('does not transform a variant another replica could not produce', async () => {
    const dragonfly = new FakeDragonfly();
    const rejecting = {
      getImageUri: vi
        .fn()
        .mockRejectedValue(
          new BadRequestException('Transformation exceeds quality limit!')
        ),
    };
    const transform = async (media: typeof rejecting) =>
      (await createController(media, undefined, dragonfly)).transformImage(
        createResponse() as unknown as NodeResponse,
        request('/v1/image-2?quality=90'),
        'image-2',
        { quality: 90, sig: 'signed' }
      );
    await expect(transform(rejecting)).rejects.toThrow(
      'Transformation exceeds quality limit!'
    );
    const other = { getImageUri: vi.fn() };

    await expect(transform(other)).rejects.toThrow(
      'Transformation exceeds quality limit!'
    );
    expect(other.getImageUri).not.toHaveBeenCalled();
  });

  it('looks a deleted image up again instead of redirecting to its old variant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
    const media = {
      getImageUri: vi
        .fn()
        .mockResolvedValue({ uri: 'images/image-3/{}', exists: true }),
      deleteImage: vi.fn(),
    };
    const controller = await createController(media);
    const transform = () =>
      controller.transformImage(
        createResponse() as unknown as NodeResponse,
        request('/v1/image-3'),
        'image-3',
        {}
      );
    await transform();
    await transform();

    await controller.deleteImage(
      createResponse() as unknown as NodeResponse,
      'image-3'
    );
    await transform();

    expect(media.getImageUri).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe('AppController documents', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('looks a deleted document up again instead of redirecting to its old file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
    const media = {
      getDocumentUri: vi
        .fn()
        .mockResolvedValue({ uri: 'documents/doc-9/file.pdf', exists: true }),
      deleteDocument: vi.fn(),
    };
    const controller = await createController(media);
    const get = () =>
      controller.getDocument(
        createResponse() as unknown as NodeResponse,
        request('/v1/document/doc-9'),
        'doc-9'
      );
    await get();
    await get();

    await controller.deleteDocument(
      createResponse() as unknown as NodeResponse,
      'doc-9'
    );
    await get();

    expect(media.getDocumentUri).toHaveBeenCalledTimes(2);
  });

  it('looks a missing document up once before sending it to the fallback', async () => {
    const media = {
      getDocumentUri: vi
        .fn()
        .mockResolvedValue({ uri: 'documents/doc-1', exists: false }),
    };
    const res = createResponse();

    await (
      await createController(media, FALLBACK_URL)
    ).getDocument(
      res as unknown as NodeResponse,
      request('/v1/document/doc-1'),
      'doc-1'
    );

    expect(media.getDocumentUri).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      `${FALLBACK_URL}/v1/document/doc-1`
    );
  });

  it('looks a missing document up once before sending its thumbnail to the fallback', async () => {
    const media = {
      getDocumentThumbnailUri: vi.fn().mockResolvedValue({
        uri: 'documents/doc-1/thumbnail',
        exists: false,
      }),
    };
    const res = createResponse();

    await (
      await createController(media, FALLBACK_URL)
    ).getDocumentThumbnail(
      res as unknown as NodeResponse,
      request('/v1/document/doc-1/thumbnail'),
      'doc-1'
    );

    expect(media.getDocumentThumbnailUri).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      `${FALLBACK_URL}/v1/document/doc-1/thumbnail`
    );
  });

  it('answers a missing document on a fresh pod without probing the public host', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetch);
    const media = {
      getDocumentUri: vi
        .fn()
        .mockResolvedValue({ uri: 'documents/doc-2', exists: false }),
    };
    const res = createResponse();

    await (
      await createController(media)
    ).getDocument(
      res as unknown as NodeResponse,
      request('/v1/document/doc-2'),
      'doc-2'
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      307,
      expect.stringContaining('documents/doc-2')
    );
  });

  it('probes the public host once for concurrent requests', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const media = {
      getDocumentUri: vi.fn(async (id: string) => ({
        uri: `documents/${id}/file.pdf`,
        exists: true,
      })),
    };
    const controller = await createController(media);

    await Promise.all(
      ['doc-3', 'doc-4', 'doc-5'].map(id =>
        controller.getDocument(
          createResponse() as unknown as NodeResponse,
          request(`/v1/document/${id}`),
          id
        )
      )
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
