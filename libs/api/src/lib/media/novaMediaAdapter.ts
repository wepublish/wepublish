import { URL } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import type { FileUpload } from 'graphql-upload-ts';
import {
  ArrayBufferUpload,
  ImageTransformation,
  ImageWithFocalPoint,
  MediaAdapter,
  UploadImage,
} from '@wepublish/image/api';
import {
  getSignatureForImage,
  TransformationsDto,
  TransformationsSchema,
} from '@wepublish/media-transform-guard';
import { validateImageDimension } from '@wepublish/media-transform-guard';

export class MediaServerError extends Error {
  constructor(message: string) {
    super(`Received error from media server. Message: ${message}`);
  }
}

export class NovaMediaAdapter implements MediaAdapter {
  constructor(
    private url: URL,
    private token: string,
    private config: { quality: number },
    private internalURL: URL = url
  ) {}

  async _uploadImage(form: FormData): Promise<UploadImage> {
    // The form-data module reports a known length for the stream returned by createReadStream,
    // which is wrong, override it and always set it to false.
    // Related issue: https://github.com/form-data/form-data/issues/394
    form.hasKnownLength = () => false;

    const response = await fetch(this.internalURL, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}` },
      body: form,
      // will work with newer node version, @ts-expect-error doesn't work here unfortunately
      signal: AbortSignal.timeout(50000) as any,
    });

    const json = await response.json();

    if (response.status >= 400) {
      throw new MediaServerError(response.statusText);
    }

    const {
      id,
      filename,
      fileSize,
      extension,
      mimeType,
      format,
      width,
      height,
    } = json;

    return {
      id,
      filename,
      fileSize,
      extension,
      mimeType,
      format,
      width,
      height,
    };
  }

  async uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage> {
    const form = new FormData();

    const {
      filename: inputFilename,
      mimetype,
      createReadStream,
    }: FileUpload = await fileUpload;
    form.append('file', createReadStream(), {
      filename: inputFilename,
      contentType: mimetype,
    });

    return this._uploadImage(form);
  }

  async uploadImageFromArrayBuffer(
    arrayBufferUpload: Promise<ArrayBufferUpload>
  ): Promise<UploadImage> {
    const form = new FormData();
    const {
      filename: inputFilename,
      mimetype,
      arrayBuffer,
    }: ArrayBufferUpload = await arrayBufferUpload;
    form.append('file', arrayBuffer, {
      filename: inputFilename,
      contentType: mimetype,
    });

    return this._uploadImage(form);
  }

  async deleteImage(id: string): Promise<boolean> {
    const response = await fetch(`${this.internalURL}/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${this.token}` },
    });

    if (response.status >= 400) {
      throw new MediaServerError(response.statusText);
    }

    return true;
  }

  async getImageURL(
    image: ImageWithFocalPoint,
    transformations?: ImageTransformation
  ): Promise<string> {
    const queryParameters = [] as string[];

    if (transformations?.width || transformations?.height) {
      let xFocalPoint = '';
      let yFocalPoint = '';

      if (image?.focalPoint?.x) {
        xFocalPoint =
          image.focalPoint.x > 0.6 ? 'right'
          : image.focalPoint.x < 0.4 ? 'left'
          : '';
      }

      if (image?.focalPoint?.y) {
        yFocalPoint =
          image.focalPoint.y > 0.6 ? 'bottom'
          : image.focalPoint.y < 0.4 ? 'top'
          : '';
      }

      const position = `${xFocalPoint} ${yFocalPoint}`.trim() || undefined;

      validateImageDimension(transformations.width, transformations.height);

      queryParameters.push(
        `resize=${JSON.stringify({
          width: transformations.width,
          height: transformations.height,
          withoutEnlargement: true,
          fit: 'cover',
          position,
        })}`
      );
    }

    /** NOT USED AT THE MOMENT WE SHOULD NOT HAVE UNUSED FUNCTIONS AS DDOS SURFACE THEY NEED TO BE LIMITED BY CONFIGURATION SAME AS QUALITY AND DIMENSION!
    if (
      transformations?.rotation &&
      // Ignore no rotation settings
      ![ImageRotation.Auto, ImageRotation.Rotate0].includes(transformations.rotation)
    ) {
      queryParameters.push(`rotate=${transformations.rotation}`)
    }

    if (transformations?.blur) {
      queryParameters.push(
        `blur=${Number.isInteger(transformations.blur) ? transformations.blur : 5}`
      )
    }

    if (transformations?.negate) {
      queryParameters.push(`negate=1`)
    }

    if (transformations?.grayscale) {
      queryParameters.push(`grayscale=1`)
    }

    if (transformations?.sharpen) {
      queryParameters.push(`sharpen=1`)
    }
    **/

    // Max quality is 80 so 1 => 80
    queryParameters.push(`quality=${Math.ceil(this.config.quality * 80)}`);

    const transformationsDto = this.parseTransformations(queryParameters);

    const signature = getSignatureForImage(image.id, transformationsDto);
    queryParameters.push(`sig=${signature}`);

    return encodeURI(`${this.url}/${image.id}?${queryParameters.join('&')}`);
  }

  /**
   * Parse and validate image-transformation parameters from an array of `key=value` strings.
   */

  parseTransformations(params: string[]): TransformationsDto {
    const raw: Record<string, string> = {};

    for (const entry of params) {
      const eq = entry.indexOf('=');

      if (eq === -1) {
        continue;
      }

      const key = entry.slice(0, eq).trim();
      const value = entry.slice(eq + 1).trim();
      raw[key] = value;
    }

    return TransformationsSchema.parse(raw) as TransformationsDto;
  }
}
