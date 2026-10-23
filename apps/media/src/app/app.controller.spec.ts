import { afterEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCache } from 'cache-manager';
import { Response as ExpressResponse } from 'express';
import {
  KvTtlCacheService,
  MemoryAtomicStore,
} from '@wepublish/kv-ttl-cache/api/core';
import {
  LINK_CACHE_CONFIG,
  LinkCache,
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
  };
  res.status.mockReturnValue(res);

  return res;
};

class SharedStore extends MemoryAtomicStore {
  override readonly shared = true;
}

const createSharedStore = () => {
  const store = new SharedStore();
  vi.spyOn(store, 'setRaw');

  return store;
};

const valueWrites = (store: SharedStore) =>
  vi.mocked(store.setRaw).mock.calls.filter(([key]) => key.startsWith('val:'));

const createController = (
  media: Partial<Record<keyof MediaService, unknown>>,
  fallbackUrl?: string,
  shared = createSharedStore()
) =>
  new AppController(
    media as unknown as MediaService,
    new LinkCache(
      new KvTtlCacheService(createCache(), shared, LINK_CACHE_CONFIG)
    ),
    { get: () => fallbackUrl } as unknown as ConfigService
  );

const request = (url: string) => ({ url }) as unknown as Request;

describe('AppController images', () => {
  it('does not write the shared cache again when a link is found', async () => {
    const shared = createSharedStore();
    const media = {
      getImageUri: vi
        .fn()
        .mockResolvedValue({ uri: 'images/image-1/{}', exists: true }),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
    const controller = createController(media, undefined, shared);

    for (let i = 0; i < 3; i++) {
      await controller.transformImage(
        createResponse() as unknown as ExpressResponse,
        request('/v1/image-1'),
        'image-1',
        {}
      );
    }

    expect(valueWrites(shared)).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it('does not transform a variant another replica could not produce', async () => {
    const shared = createSharedStore();
    const rejecting = {
      getImageUri: vi
        .fn()
        .mockRejectedValue(
          new BadRequestException('Transformation exceeds quality limit!')
        ),
    };
    const transform = (media: typeof rejecting) =>
      createController(media, undefined, shared).transformImage(
        createResponse() as unknown as ExpressResponse,
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
});

describe('AppController documents', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('looks a missing document up once before sending it to the fallback', async () => {
    const media = {
      getDocumentUri: vi
        .fn()
        .mockResolvedValue({ uri: 'documents/doc-1', exists: false }),
    };
    const res = createResponse();

    await createController(media, FALLBACK_URL).getDocument(
      res as unknown as ExpressResponse,
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

    await createController(media, FALLBACK_URL).getDocumentThumbnail(
      res as unknown as ExpressResponse,
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

    await createController(media).getDocument(
      res as unknown as ExpressResponse,
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
    const controller = createController(media);

    await Promise.all(
      ['doc-3', 'doc-4', 'doc-5'].map(id =>
        controller.getDocument(
          createResponse() as unknown as ExpressResponse,
          request(`/v1/document/${id}`),
          id
        )
      )
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
