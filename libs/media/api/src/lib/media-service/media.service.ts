import { Injectable, Logger } from '@nestjs/common';
import {
  InjectDisk,
  StorageDisk,
  StorageFileNotFoundError,
} from '@nestjs/storage';
import sharp from 'sharp';
import { TransformGuard } from './transform.guard';
import { createConcurrencyLimit } from './concurrency-limit';
import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export const MAX_CONCURRENT_TRANSFORMS = 4;

const PDF_RENDER_TIMEOUT = 15_000;
import {
  removeSignatureFromTransformations,
  getTransformationKey,
  OutputFormat,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { JwksClientService } from '../authentication/jwks-client.service';
import {
  getDocumentCategory,
  getMimeTypeForExtension,
  DocumentCategory,
} from './supported-documents-validator';

export const UPLOAD_DISK = 'upload';

export const TRANSFORMATION_DISK = 'transformation';

const GENERIC_CONTENT_TYPE = 'application/octet-stream';

const GENERIC_CONTENT_TYPES = [GENERIC_CONTENT_TYPE, 'binary/octet-stream'];

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
// Only these keep every frame; jpeg and png would get all frames stacked on top of each other.
const ANIMATED_FORMATS: OutputFormat[] = ['webp', 'gif'];

const encode = (
  image: sharp.Sharp,
  format: OutputFormat,
  quality: number | undefined,
  effort: number
) => {
  switch (format) {
    case 'jpeg':
      // jpeg has no alpha channel, sharp would otherwise fill it black
      return image.flatten({ background: '#ffffff' }).jpeg({ quality });
    case 'png':
      return image.png();
    case 'gif':
      return image.gif();
    case 'webp':
      return image.webp({ quality, effort });
  }
};

export type ImageURIObject = {
  uri: string;
  exists: boolean;
};

@Injectable()
export class MediaService {
  private readonly pendingImages = new Map<string, Promise<ImageURIObject>>();

  private readonly limitTransforms = createConcurrencyLimit(
    MAX_CONCURRENT_TRANSFORMS
  );

  constructor(
    @InjectDisk(UPLOAD_DISK) private uploads: StorageDisk,
    @InjectDisk(TRANSFORMATION_DISK) private transformations: StorageDisk,
    private jwksClient: JwksClientService
  ) {}

  public generateETag(buffer: Buffer): string {
    const hash = createHash('md5');
    hash.update(buffer);
    return `"${hash.digest('hex')}"`;
  }

  private async listKeys(disk: StorageDisk, prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for await (const entry of disk.listAll({ prefix })) {
      keys.push(entry.key);
    }
    return keys;
  }

  private async deleteKeys(disk: StorageDisk, prefix: string): Promise<void> {
    const keys = await this.listKeys(disk, prefix);
    if (keys.length) {
      await disk.delete(keys);
    }
  }

  public async getImageUri(
    imageId: string,
    transformations: TransformationsDto
  ): Promise<ImageURIObject> {
    const transformationsKey = getTransformationKey(
      removeSignatureFromTransformations(transformations)
    );
    const objectUri = `images/${imageId}/${transformationsKey}`;
    const pendingKey = `${objectUri}#${transformations.sig ?? ''}`;

    const pending = this.pendingImages.get(pendingKey);
    if (pending) {
      return await pending;
    }

    const request = this.resolveImageUri(
      imageId,
      objectUri,
      transformations
    ).finally(() => this.pendingImages.delete(pendingKey));
    this.pendingImages.set(pendingKey, request);

    return await request;
  }

  private async resolveImageUri(
    imageId: string,
    objectUri: string,
    transformations: TransformationsDto
  ): Promise<ImageURIObject> {
    if (!(await this.transformations.exists(objectUri))) {
      return await this.limitTransforms(() =>
        this.transformImage(imageId, transformations)
      );
    }
    return { uri: objectUri, exists: true };
  }

  private async getFallbackImage(
    transformations: TransformationsDto
  ): Promise<Buffer> {
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
    return await fs.promises.readFile(defaultImagePath);
  }

  private hasTransformations(t: TransformationsDto): boolean {
    const { sig, ...rest } = t;
    return Object.keys(rest).length > 0;
  }

  private async transformImage(
    imageId: string,
    transformations: TransformationsDto
  ): Promise<ImageURIObject> {
    const originalTransformations = structuredClone(transformations);
    const transformGuard = new TransformGuard();

    // Validate signature when transformations are requested.
    // Raw image requests without any parameters skip signature validation.
    if (this.hasTransformations(originalTransformations)) {
      const publicKey = await this.jwksClient.getPublicKey();
      await transformGuard.validateSignature(
        publicKey,
        imageId,
        originalTransformations
      );
    }

    let image: Buffer;
    let imageExists = true;
    try {
      image = await this.uploads.getBuffer(`images/${imageId}`);
    } catch (e: any) {
      if (e instanceof StorageFileNotFoundError) {
        imageExists = false;
        image = await this.getFallbackImage(
          removeSignatureFromTransformations(transformations)
        );
      } else {
        throw e;
      }
    }

    const transformationsKey = getTransformationKey(
      removeSignatureFromTransformations(transformations)
    );

    if (
      !imageExists &&
      (await this.transformations.exists(
        `images/fallback/${transformationsKey}`
      ))
    ) {
      return { uri: `images/fallback/${transformationsKey}`, exists: false };
    }

    const format = transformations.format ?? 'webp';
    const sharpInstance = sharp(image, {
      animated: ANIMATED_FORMATS.includes(format),
      failOn: 'error',
    });

    const metadata = await sharpInstance.metadata();

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

    const transformedImage = encode(
      sharpInstance,
      format,
      transformations.quality,
      effort
    );

    const { data: transformedBuffer, info } = await transformedImage.toBuffer({
      resolveWithObject: true,
    });
    transformGuard.checkImageSize({ size: info.size } as sharp.Metadata);

    const exists = imageExists;
    const uri =
      imageExists ?
        `images/${imageId}/${transformationsKey}`
      : `images/fallback/${transformationsKey}`;

    await this.transformations.put(uri, transformedBuffer, {
      contentType: `image/${format}`,
      contentLength: info.size,
    });

    return { uri, exists };
  }

  public async saveImage(imageId: string, image: Buffer) {
    let buffer = image;
    let metadata = await sharp(image).metadata();

    const isAnimated = (metadata.pages ?? 1) > 1;
    if (metadata.orientation && metadata.orientation > 1 && !isAnimated) {
      const pipeline = sharp(image).rotate().withMetadata();
      if (metadata.format === 'jpeg') {
        pipeline.jpeg({ quality: 95, mozjpeg: true });
      }
      buffer = await pipeline.toBuffer();
      metadata = await sharp(buffer).metadata();
    }

    await this.uploads.put(`images/${imageId}`, buffer, {
      contentType: `image/${metadata.format}`,
      contentLength: buffer.length,
    });
    return metadata;
  }

  public async hasImage(imageId: string): Promise<boolean> {
    return await this.uploads.exists(`images/${imageId}`);
  }

  public async deleteImage(imageId: string) {
    await this.deleteKeys(this.transformations, `images/${imageId}`);

    return await this.uploads.delete(`images/${imageId}`);
  }

  public async saveDocument(
    documentId: string,
    document: Buffer,
    mimeType: string,
    originalFilename: string
  ) {
    const objectKey = `documents/${documentId}/${originalFilename}`;
    await this.uploads.put(objectKey, document, {
      contentType: mimeType,
      contentLength: document.length,
    });
    return { size: document.length };
  }

  public async getDocumentUri(documentId: string): Promise<ImageURIObject> {
    // List files under documents/{documentId}/ to find the stored file with its original name
    const keys = await this.listKeys(this.uploads, `documents/${documentId}/`);
    const objectUri = keys[0];
    if (!objectUri) {
      return { uri: `documents/${documentId}`, exists: false };
    }

    // Check if already copied to transformation bucket with the current content type
    const [contentType, copiedContentType] = await Promise.all([
      this.getDocumentContentType(objectUri),
      this.getStoredContentType(this.transformations, objectUri),
    ]);
    if (copiedContentType === contentType) {
      return { uri: objectUri, exists: true };
    }

    // Copy from upload bucket to transformation bucket on first request
    try {
      const document = await this.uploads.getBuffer(objectUri);

      await this.transformations.put(objectUri, document, {
        contentType,
        contentLength: document.length,
      });

      return { uri: objectUri, exists: true };
    } catch (e: any) {
      if (e instanceof StorageFileNotFoundError) {
        return { uri: objectUri, exists: false };
      }
      throw e;
    }
  }

  private async getStoredContentType(
    disk: StorageDisk,
    objectUri: string
  ): Promise<string | undefined> {
    return await disk
      .stat(objectUri)
      .then(file => file.contentType)
      .catch(() => undefined);
  }

  private async getDocumentContentType(objectUri: string): Promise<string> {
    const uploadedContentType = await this.getStoredContentType(
      this.uploads,
      objectUri
    );
    if (
      uploadedContentType &&
      !GENERIC_CONTENT_TYPES.includes(uploadedContentType)
    ) {
      return uploadedContentType;
    }
    return (
      getMimeTypeForExtension(path.extname(objectUri)) ?? GENERIC_CONTENT_TYPE
    );
  }

  public async hasDocument(documentId: string): Promise<boolean> {
    const keys = await this.listKeys(this.uploads, `documents/${documentId}/`);
    return keys.length > 0;
  }

  public async deleteDocument(documentId: string) {
    // Delete all files under documents/{documentId}/ from both buckets
    await this.deleteKeys(this.transformations, `documents/${documentId}/`);
    await this.deleteKeys(this.uploads, `documents/${documentId}/`);
  }

  private readonly thumbnailLogger = new Logger('DocumentThumbnail');

  public async getDocumentThumbnailUri(
    documentId: string
  ): Promise<ImageURIObject> {
    const thumbnailUri = `documents/${documentId}/thumbnail`;

    // Return cached thumbnail if it exists
    if (await this.transformations.exists(thumbnailUri)) {
      return { uri: thumbnailUri, exists: true };
    }

    // Find the original file from upload bucket
    const keys = await this.listKeys(this.uploads, `documents/${documentId}/`);
    const objectKey = keys.find(key => !key.endsWith('/thumbnail'));
    if (!objectKey) {
      return { uri: thumbnailUri, exists: false };
    }

    // Determine file category from the stored content type
    const category = getDocumentCategory(
      await this.getDocumentContentType(objectKey)
    );

    // For PDFs, generate a preview of the first page
    if (category === 'pdf') {
      return this.limitTransforms(() =>
        this.generatePdfThumbnail(documentId, objectKey, thumbnailUri)
      );
    }

    // For all other types, use a static icon based on file category
    return this.generateStaticThumbnail(category, thumbnailUri);
  }

  private async generateStaticThumbnail(
    category: DocumentCategory,
    thumbnailUri: string
  ): Promise<ImageURIObject> {
    try {
      const iconPath = path.join(__dirname, 'assets', `icon-${category}.svg`);

      // Fall back to generic if specific icon doesn't exist
      const resolvedPath =
        fs.existsSync(iconPath) ? iconPath : (
          path.join(__dirname, 'assets', 'icon-generic.svg')
        );

      const thumbnailBuffer = await sharp(resolvedPath)
        .resize(200, 260)
        .webp({ quality: 80 })
        .toBuffer();

      await this.transformations.put(thumbnailUri, thumbnailBuffer, {
        contentType: 'image/webp',
        contentLength: thumbnailBuffer.length,
      });

      return { uri: thumbnailUri, exists: true };
    } catch (err) {
      this.thumbnailLogger.warn(
        `Static thumbnail generation failed: ${(err as Error).message}`
      );
      return { uri: thumbnailUri, exists: false };
    }
  }

  private async generatePdfThumbnail(
    documentId: string,
    objectKey: string,
    thumbnailUri: string
  ): Promise<ImageURIObject> {
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.uploads.getBuffer(objectKey);
    } catch (e: any) {
      if (e instanceof StorageFileNotFoundError) {
        return { uri: thumbnailUri, exists: false };
      }
      throw e;
    }

    // Create a secure temp directory for this operation
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-thumb-'));
    const tmpPdf = path.join(tmpDir, 'input.pdf');
    const tmpOutPrefix = path.join(tmpDir, 'thumb');

    const cleanup = () => {
      try {
        const thumbPath = path.join(tmpDir, 'thumb-1.png');
        const altPath = path.join(tmpDir, 'thumb-01.png');
        if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        if (fs.existsSync(altPath)) fs.unlinkSync(altPath);
        fs.rmdirSync(tmpDir);
      } catch {
        // ignore cleanup errors
      }
    };

    try {
      fs.writeFileSync(tmpPdf, pdfBuffer);

      await execFileAsync(
        'pdftoppm',
        [
          '-png',
          '-f',
          '1',
          '-l',
          '1',
          '-scale-to',
          '600',
          tmpPdf,
          tmpOutPrefix,
        ],
        { timeout: PDF_RENDER_TIMEOUT, killSignal: 'SIGKILL' }
      );

      const thumbPath = `${tmpOutPrefix}-1.png`;
      if (!fs.existsSync(thumbPath)) {
        const altPath = `${tmpOutPrefix}-01.png`;
        if (!fs.existsSync(altPath)) {
          this.thumbnailLogger.warn(
            `Thumbnail generation produced no output for document ${documentId}`
          );
          cleanup();
          // Fall back to static PDF icon
          return this.generateStaticThumbnail('pdf', thumbnailUri);
        }
        fs.renameSync(altPath, thumbPath);
      }

      const thumbnailBuffer = await sharp(thumbPath)
        .webp({ quality: 80 })
        .toBuffer();

      await this.transformations.put(thumbnailUri, thumbnailBuffer, {
        contentType: 'image/webp',
        contentLength: thumbnailBuffer.length,
      });

      cleanup();
      return { uri: thumbnailUri, exists: true };
    } catch (err) {
      cleanup();
      this.thumbnailLogger.warn(
        `PDF thumbnail generation failed for document ${documentId}: ${(err as Error).message}`
      );
      // Fall back to static PDF icon
      return this.generateStaticThumbnail('pdf', thumbnailUri);
    }
  }
}
