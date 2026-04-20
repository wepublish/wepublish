import { Inject, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { StorageClient } from '../storage-client/storage-client.service';
import { TransformGuard } from './transform.guard';
import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);
import {
  removeSignatureFromTransformations,
  getTransformationKey,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { JwksClientService } from '../authentication/jwks-client.service';
import {
  getDocumentCategory,
  DocumentCategory,
} from './supported-documents-validator';

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
export type ImageURIObject = {
  uri: string;
  exists: boolean;
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_SERVICE_MODULE_OPTIONS) private config: MediaServiceConfig,
    private storage: StorageClient,
    private jwksClient: JwksClientService
  ) {}

  public generateETag(buffer: Buffer): string {
    const hash = createHash('md5');
    hash.update(buffer);
    return `"${hash.digest('hex')}"`;
  }

  public async getImageUri(
    imageId: string,
    transformations: TransformationsDto
  ): Promise<ImageURIObject> {
    const transformationsKey = getTransformationKey(
      removeSignatureFromTransformations(transformations)
    );
    const objectUri = `images/${imageId}/${transformationsKey}`;
    if (
      !(await this.storage.hasFile(this.config.transformationBucket, objectUri))
    ) {
      return await this.transformImage(imageId, transformations);
    }
    return { uri: objectUri, exists: true };
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

  private hasTransformations(t: TransformationsDto): boolean {
    const { sig, ...rest } = t;
    return Object.keys(rest).length > 0;
  }

  private async transformImage(
    imageId: string,
    transformations: TransformationsDto
  ): Promise<ImageURIObject> {
    const originalTransformations = structuredClone(transformations);
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
      if (
        await this.storage.hasFile(
          this.config.transformationBucket,
          `images/fallback/${transformationsKey}`
        )
      ) {
        return { uri: `images/fallback/${transformationsKey}`, exists: false };
      }
    }

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

    const sharpInstance = imageStream.pipe(
      sharp({
        animated: true,
        failOn: 'error',
      })
    );

    try {
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

      const transformedImage = sharpInstance.webp({
        quality: transformations.quality,
        effort,
      });

      const { data: transformedBuffer, info } = await transformedImage.toBuffer(
        { resolveWithObject: true }
      );
      transformGuard.checkImageSize({ size: info.size } as sharp.Metadata);

      let uri;
      let exists = true;
      if (imageExists) {
        uri = `images/${imageId}/${transformationsKey}`;
        await this.storage.saveFile(
          this.config.transformationBucket,
          uri,
          transformedBuffer,
          info.size,
          { ContentType: `image/webp` }
        );
      } else {
        exists = false;
        uri = `images/fallback/${transformationsKey}`;
        await this.storage.saveFile(
          this.config.transformationBucket,
          uri,
          transformedBuffer,
          info.size,
          { ContentType: `image/webp` }
        );
      }
      return { uri, exists };
    } finally {
      imageStream.destroy();
    }
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
    await this.storage.deleteFiles(
      this.config.transformationBucket,
      objects.map(file => file.name || '')
    );

    // Delete main image
    return await this.storage.deleteFile(
      this.config.uploadBucket,
      `images/${imageId}`
    );
  }

  public async saveDocument(
    documentId: string,
    document: Buffer,
    mimeType: string,
    originalFilename: string
  ) {
    const objectKey = `documents/${documentId}/${originalFilename}`;
    await this.storage.saveFile(
      this.config.uploadBucket,
      objectKey,
      document,
      document.length,
      { ContentType: mimeType }
    );
    return { size: document.length };
  }

  public async getDocumentUri(documentId: string): Promise<ImageURIObject> {
    // List files under documents/{documentId}/ to find the stored file with its original name
    const files = await this.storage.listFiles(
      this.config.uploadBucket,
      `documents/${documentId}/`,
      false
    );
    const uploadedFile = files[0];
    if (!uploadedFile?.name) {
      return { uri: `documents/${documentId}`, exists: false };
    }

    const objectUri = uploadedFile.name;

    // Check if already copied to transformation bucket
    if (
      await this.storage.hasFile(this.config.transformationBucket, objectUri)
    ) {
      return { uri: objectUri, exists: true };
    }

    // Copy from upload bucket to transformation bucket on first request
    try {
      const stream = await this.storage.getFile(
        this.config.uploadBucket,
        objectUri
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      await this.storage.saveFile(
        this.config.transformationBucket,
        objectUri,
        buffer,
        buffer.length,
        { ContentType: 'application/pdf' }
      );

      return { uri: objectUri, exists: true };
    } catch (e: any) {
      if (e.code === 'NoSuchKey') {
        return { uri: objectUri, exists: false };
      }
      throw e;
    }
  }

  public async hasDocument(documentId: string): Promise<boolean> {
    const files = await this.storage.listFiles(
      this.config.uploadBucket,
      `documents/${documentId}/`,
      false
    );
    return files.length > 0;
  }

  public async deleteDocument(documentId: string) {
    // Delete all files under documents/{documentId}/ from both buckets
    const transformFiles = await this.storage.listFiles(
      this.config.transformationBucket,
      `documents/${documentId}/`,
      true
    );
    if (transformFiles.length) {
      await this.storage.deleteFiles(
        this.config.transformationBucket,
        transformFiles.map(f => f.name || '')
      );
    }

    const uploadFiles = await this.storage.listFiles(
      this.config.uploadBucket,
      `documents/${documentId}/`,
      true
    );
    if (uploadFiles.length) {
      await this.storage.deleteFiles(
        this.config.uploadBucket,
        uploadFiles.map(f => f.name || '')
      );
    }
  }

  private readonly thumbnailLogger = new Logger('DocumentThumbnail');

  public async getDocumentThumbnailUri(
    documentId: string
  ): Promise<ImageURIObject> {
    const thumbnailUri = `documents/${documentId}/thumbnail`;

    // Return cached thumbnail if it exists
    if (
      await this.storage.hasFile(this.config.transformationBucket, thumbnailUri)
    ) {
      return { uri: thumbnailUri, exists: true };
    }

    // Find the original file from upload bucket
    const files = await this.storage.listFiles(
      this.config.uploadBucket,
      `documents/${documentId}/`,
      false
    );
    const uploadedFile = files.find(
      f => f.name && !f.name.endsWith('/thumbnail')
    );
    if (!uploadedFile?.name) {
      return { uri: thumbnailUri, exists: false };
    }

    // Determine file category from extension in the stored filename
    const ext = path.extname(uploadedFile.name).toLowerCase();
    const extToMime: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      '.odp': 'application/vnd.oasis.opendocument.presentation',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
    };
    const contentType = extToMime[ext] ?? 'application/octet-stream';
    const category = getDocumentCategory(contentType);

    // For PDFs, generate a preview of the first page
    if (category === 'pdf') {
      return this.generatePdfThumbnail(
        documentId,
        uploadedFile.name,
        thumbnailUri
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

      await this.storage.saveFile(
        this.config.transformationBucket,
        thumbnailUri,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { ContentType: 'image/webp' }
      );

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
    let pdfStream: Readable;
    try {
      pdfStream = await this.storage.getFile(
        this.config.uploadBucket,
        objectKey
      );
    } catch (e: any) {
      if (e.code === 'NoSuchKey') {
        return { uri: thumbnailUri, exists: false };
      }
      throw e;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

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

      await execFileAsync('pdftoppm', [
        '-png',
        '-f',
        '1',
        '-l',
        '1',
        '-scale-to',
        '600',
        tmpPdf,
        tmpOutPrefix,
      ]);

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

      await this.storage.saveFile(
        this.config.transformationBucket,
        thumbnailUri,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { ContentType: 'image/webp' }
      );

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
