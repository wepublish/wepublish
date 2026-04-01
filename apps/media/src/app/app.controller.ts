import {
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Res,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ImageURIObject,
  MediaService,
  SupportedImagesValidator,
  SupportedDocumentsValidator,
  JwtAuthGuard,
} from '@wepublish/media/api';
import {
  getTransformationKey,
  removeSignatureFromTransformations,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import 'multer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { assertRemoteFileIsAccessible } from './assertRemoteFileIsAccessible';

const HTTP_CODE_FOUND = 301;
const HTTP_CODE_NOT_FOUND = 307;
let S3_HOST_CHECKED = false;

/** Sanitize user-provided IDs to prevent path traversal */
const sanitizeId = (id: string): string => id.replace(/[^a-zA-Z0-9_-]/g, '');

@Controller({
  version: '1',
})
export class AppController {
  private readonly fallbackUrl?: string;

  constructor(
    private media: MediaService,
    @Inject(CACHE_MANAGER) private linkCache: Cache,
    config: ConfigService
  ) {
    this.fallbackUrl = config.get<string>('MEDIA_FALLBACK_URL');
  }

  private setProductionCacheHeaders(res: Response) {
    if (process.env['NODE_ENV'] === 'production') {
      // max-age = 12hours, immutable, stale-if-error = 7days, stale-while-revalidate = 1day
      res.setHeader(
        'Cache-Control',
        `public, max-age=43200, immutable, stale-if-error=604800, stale-while-revalidate=86400`
      );
    }
  }

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    res.status(200).send({ status: 'ok' });
  }

  @Get('/favicon.ico')
  async favicon(@Res() res: Response) {
    throw new NotFoundException();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Res() res: Response,
    @Query('imageId') imageId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new SupportedImagesValidator()],
      })
    )
    uploadedFile: Express.Multer.File
  ) {
    const metadata = await this.media.saveImage(imageId, uploadedFile.buffer);

    res.status(201).send({
      id: imageId,
      filename: `${imageId}`,
      fileSize: metadata.size,
      mimeType: `image/${metadata.format}`,
      format: metadata.format,
      extension: `.${metadata.format}`,
      width: metadata.width,
      height: metadata.height,
    });
  }

  @Get(':imageId')
  async transformImage(
    @Res() res: Response,
    @Req() req: Request,
    @Param('imageId') imageId: string,
    @Query() transformations: TransformationsDto
  ) {
    const cacheKey = `${imageId}-${getTransformationKey(
      removeSignatureFromTransformations(transformations)
    )}`;

    // Check if image is cached
    const uriFromCache = await this.linkCache.get<ImageURIObject>(cacheKey);

    if (uriFromCache) {
      if (!uriFromCache.exists && this.fallbackUrl) {
        res.setHeader('Cache-Control', `public, max-age=600`);
        res.redirect(HTTP_CODE_FOUND, `${this.fallbackUrl}${(req as any).url}`);
        return;
      }
      let httpCode = HTTP_CODE_FOUND;
      if (!uriFromCache.exists) {
        res.setHeader('Cache-Control', `public, max-age=600`);
        httpCode = HTTP_CODE_NOT_FOUND;
      } else {
        this.setProductionCacheHeaders(res);
        // On access refresh cache ttl
        await this.linkCache.set(cacheKey, uriFromCache);
      }
      res.redirect(
        httpCode,
        `${process.env['S3_PUBLIC_HOST']}/${uriFromCache.uri}`
      );
      return;
    }

    if (this.fallbackUrl && !(await this.media.hasImage(imageId))) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_FOUND, `${this.fallbackUrl}${(req as any).url}`);
      return;
    }

    const { uri, exists } = await this.media.getImageUri(
      imageId,
      transformations
    );

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    if (!S3_HOST_CHECKED) {
      S3_HOST_CHECKED = await assertRemoteFileIsAccessible(url);
    }

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      if (!this.fallbackUrl) {
        await this.linkCache.set(cacheKey, { uri, exists: false }, 14400);
      }
      return;
    } else {
      await this.linkCache.set(cacheKey, { uri, exists: true });
    }

    this.setProductionCacheHeaders(res);
    res.redirect(HTTP_CODE_FOUND, url);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.media.deleteImage(imageId);

    return res.sendStatus(204);
  }

  @UseGuards(JwtAuthGuard)
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Res() res: Response,
    @Query('documentId') documentId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new SupportedDocumentsValidator()],
      })
    )
    uploadedFile: Express.Multer.File
  ) {
    const safeDocumentId = sanitizeId(documentId);
    const { size } = await this.media.saveDocument(
      safeDocumentId,
      uploadedFile.buffer,
      uploadedFile.mimetype,
      uploadedFile.originalname
    );

    res.status(201).send({
      id: safeDocumentId,
      filename: uploadedFile.originalname,
      fileSize: size,
      mimeType: uploadedFile.mimetype,
      extension: '.pdf',
    });
  }

  @Get('document/:documentId')
  async getDocument(
    @Res() res: Response,
    @Param('documentId') documentId: string
  ) {
    const { uri, exists } = await this.media.getDocumentUri(
      sanitizeId(documentId)
    );

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      return;
    }

    this.setProductionCacheHeaders(res);
    res.redirect(HTTP_CODE_FOUND, url);
  }

  @Get('document/:documentId/thumbnail')
  async getDocumentThumbnail(
    @Res() res: Response,
    @Param('documentId') documentId: string
  ) {
    const { uri, exists } = await this.media.getDocumentThumbnailUri(
      sanitizeId(documentId)
    );

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      return;
    }

    this.setProductionCacheHeaders(res);
    res.redirect(HTTP_CODE_FOUND, url);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('document/:documentId')
  async deleteDocument(
    @Res() res: Response,
    @Param('documentId') documentId: string
  ) {
    await this.media.deleteDocument(sanitizeId(documentId));

    return res.sendStatus(204);
  }
}
