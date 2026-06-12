import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ArrayBufferUpload } from '../media-adapter';
import { Injectable } from '@nestjs/common';

const DEFAULT_MIMETYPE = 'application/octet-stream';

function normalizeContentType(contentType: unknown): string {
  if (typeof contentType === 'string' && contentType.trim().length > 0) {
    return contentType.trim();
  }

  if (Array.isArray(contentType)) {
    const firstContentType = contentType.find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    );

    return firstContentType?.trim() ?? DEFAULT_MIMETYPE;
  }

  return DEFAULT_MIMETYPE;
}

@Injectable()
export class ImageFetcherService {
  constructor(private httpService: HttpService) {}

  async fetch(
    url: string,
    filename = 'transformed-image.jpg'
  ): Promise<ArrayBufferUpload> {
    try {
      const { data: arrayBuffer, headers } = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
        })
      );
      const mimetype = normalizeContentType(headers['content-type']);

      const arrayBufferUpload: ArrayBufferUpload = {
        filename,
        mimetype,
        arrayBuffer,
      };

      return arrayBufferUpload;
    } catch (error) {
      throw Error('Error fetching and transforming image');
    }
  }
}
