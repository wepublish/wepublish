import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ArrayBufferUpload } from '../media-adapter';
import { Injectable } from '@nestjs/common';

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
      const mimetype = headers['content-type'];

      const arrayBufferUpload = {
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
