import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

import { ImageFetcherService } from './image-fetcher.service';

describe('ImageFetcherService', () => {
  const buildService = (headers: Record<string, unknown>) => {
    const get = jest.fn().mockReturnValue(
      of({
        data: new ArrayBuffer(8),
        headers,
      })
    );

    return {
      get,
      service: new ImageFetcherService({ get } as unknown as HttpService),
    };
  };

  it('returns the response content type as upload MIME type', async () => {
    const { service } = buildService({ 'content-type': 'image/png' });

    await expect(
      service.fetch('https://example.com/image.png')
    ).resolves.toMatchObject({
      mimetype: 'image/png',
    });
  });

  it('falls back to an octet stream MIME type when the response content type is unusable', async () => {
    const { service } = buildService({ 'content-type': 1234 });

    await expect(
      service.fetch('https://example.com/image')
    ).resolves.toMatchObject({
      mimetype: 'application/octet-stream',
    });
  });
});
