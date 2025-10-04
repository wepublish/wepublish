import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { StorageClient } from '../storage-client/storage-client.service';
import { TransformGuard } from './transform.guard';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import {
  removeSignatureFromTransformations,
  getTransformationKey,
  TransformationsDto,
} from '@wepublish/media-transform-guard';

export const MEDIA_SERVICE_MODULE_OPTIONS = Symbol(
  'MEDIA_SERVICE_MODULE_OPTIONS'
);

export type MediaServiceConfig = {
  uploadBucket: string;
  transformationBucket: string;
};

export type FallbackImageRatio = {
  widthRatio: number;
  heightRatio: number;
};

const fallbackImageRatios: FallbackImageRatio[] = [
  {
    widthRatio: 4,
    heightRatio: 3,
  },
  {
    widthRatio: 16,
    heightRatio: 9,
  },
  {
    widthRatio: 1,
    heightRatio: 1,
  },
  {
    widthRatio: 3,
    heightRatio: 2,
  },
  {
    widthRatio: 5,
    heightRatio: 4,
  },
  {
    widthRatio: 9,
    heightRatio: 16,
  },
];

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_SERVICE_MODULE_OPTIONS) private config: MediaServiceConfig,
    private storage: StorageClient
  ) {}

  public generateETag(buffer: Buffer): string {
    const hash = createHash('md5');
    hash.update(buffer);
    return `"${hash.digest('hex')}"`;
  }

  public bufferStream(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  public async getImage(imageId: string, transformations: TransformationsDto) {
    const transformationsKey = getTransformationKey(
      removeSignatureFromTransformations(transformations)
    );

    let file: Readable;
    try {
      file = await this.storage.getFile(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`
      );
    } catch (e: any) {
      if (e.code == 'NoSuchKey') {
        return await this.transformImage(imageId, transformations);
      }
      throw e;
    }
    const fileBuffer = await this.bufferStream(file);

    return await Promise.all([Readable.from(fileBuffer), true]);
  }

  private getFallbackImage(transformations: TransformationsDto): Readable {
    // Modify transformations based on resize properties
    if (transformations.resize) {
      const hasWidth = 'width' in transformations.resize;
      const hasHeight = 'height' in transformations.resize;

      if (hasWidth && !hasHeight) {
        // Add height based on a random valid ratio
        const ratio =
          fallbackImageRatios[
            Math.floor(Math.random() * fallbackImageRatios.length)
          ];
        transformations.resize.height = Math.round(
          transformations.resize.width! * (ratio.heightRatio / ratio.widthRatio)
        );
      } else if (!hasWidth && hasHeight) {
        // Add width based on a random valid ratio
        const ratio =
          fallbackImageRatios[
            Math.floor(Math.random() * fallbackImageRatios.length)
          ];
        transformations.resize.width = Math.round(
          transformations.resize.height! *
            (ratio.widthRatio / ratio.heightRatio)
        );
      }
    }
    const defaultImagePath = path.join(
      __dirname,
      'assets',
      'fallback-image.webp'
    );
    return fs.createReadStream(defaultImagePath);
  }

  private async transformImage(
    imageId: string,
    transformations: TransformationsDto
  ) {
    let imageStream: Readable;
    let imageExists = true;
    try {
      imageStream = await this.storage.getFile(
        this.config.uploadBucket,
        `images/${imageId}`
      );
    } catch (e: any) {
      if (e.code == 'NoSuchKey') {
        imageExists = false;
        imageStream = this.getFallbackImage(
          removeSignatureFromTransformations(transformations)
        );
      } else {
        throw e;
      }
    }

    const transformationsKey = getTransformationKey(
      removeSignatureFromTransformations(transformations)
    );
    if (!imageExists) {
      try {
        imageStream = await this.storage.getFile(
          this.config.transformationBucket,
          `images/fallback/${transformationsKey}`
        );
        return Promise.all([imageStream, imageExists]);
      } catch (e: any) {
        // Intentionally ignore if fallback image is not found
      }
    }

    const transformGuard = new TransformGuard();
    transformGuard.validateSignature(imageId, transformations);

    const sharpInstance = imageStream.pipe(
      sharp({
        animated: true,
        failOn: 'error',
      })
    );
    let metadata = await sharpInstance.metadata();

    const effort = transformGuard.checkDimensions(metadata, transformations);
    transformGuard.checkQuality(transformations);

    if (transformations.extend) {
      sharpInstance.extend(transformations.extend);
    }

    if (transformations.resize) {
      // Prevent animated image from enlarging (DOS prevention)
      if (transformGuard.isAnimatedImage(metadata)) {
        transformations.resize.withoutEnlargement = true;
      }
      sharpInstance.resize(transformations.resize);
    }

    if (transformations.blur) {
      sharpInstance.blur(transformations.blur);
    }

    if (transformations.sharpen) {
      sharpInstance.sharpen();
    }

    if (transformations.flip) {
      sharpInstance.flip(transformations.flip);
    }

    if (transformations.flop) {
      sharpInstance.flop(transformations.flop);
    }

    if (transformations.rotate) {
      sharpInstance.rotate(transformations.rotate);
    }

    if (transformations.negate) {
      sharpInstance.negate(transformations.negate);
    }

    if (transformations.grayscale) {
      sharpInstance.grayscale(transformations.grayscale);
    }

    const transformedImage = sharpInstance.webp({
      quality: transformations.quality,
      effort,
    });

    metadata = await sharp(
      await transformedImage.clone().toBuffer()
    ).metadata();
    transformGuard.checkImageSize(metadata);

    if (imageExists) {
      await this.storage.saveFile(
        this.config.transformationBucket,
        `images/${imageId}/${transformationsKey}`,
        transformedImage.clone(),
        metadata.size,
        { ContentType: `image/${metadata.format}` }
      );
    } else {
      await this.storage.saveFile(
        this.config.transformationBucket,
        `images/fallback/${transformationsKey}`,
        transformedImage.clone(),
        metadata.size,
        { ContentType: `image/${metadata.format}` }
      );
    }
    return Promise.all([transformedImage, imageExists]);
  }

  public async saveImage(imageId: string, image: Buffer) {
    const metadata = await sharp(image).metadata();
    await this.storage.saveFile(
      this.config.uploadBucket,
      `images/${imageId}`,
      image,
      metadata.size,
      { ContentType: `image/${metadata.format}` }
    );
    return metadata;
  }

  public async hasImage(imageId: string): Promise<boolean> {
    return await this.storage.hasFile(
      this.config.uploadBucket,
      `images/${imageId}`
    );
  }

  public async deleteImage(imageId: string) {
    // Delete Transformations
    const objects = await this.storage.listFiles(
      this.config.transformationBucket,
      `images/${imageId}`,
      true
    );
    this.storage.deleteFiles(
      this.config.transformationBucket,
      objects.map(file => file.name || '')
    );

    // Delete main image
    return await this.storage.deleteFile(
      this.config.uploadBucket,
      `images/${imageId}`
    );
  }
}
