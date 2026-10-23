import {
  BadRequestException,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MediaService,
  SupportedImagesValidator,
  SupportedDocumentsValidator,
  getExtensionForMimeType,
  JwtAuthGuard,
  LinkCache,
  MISSING_LINK_TTL,
} from '@wepublish/media/api';
import {
  getTransformationKey,
  removeSignatureFromTransformations,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import 'multer';
import { assertRemoteFileIsAccessible } from './assertRemoteFileIsAccessible';

const HTTP_CODE_FOUND = 301;
const HTTP_CODE_NOT_FOUND = 307;

/** Sanitize user-provided IDs to prevent path traversal */
const sanitizeId = (id: string): string => id.replace(/[^a-zA-Z0-9_-]/g, '');

@Controller({
  version: '1',
})
export class AppController {
  private readonly fallbackUrl?: string;

  private publicHostCheck?: Promise<boolean>;

  constructor(
    private media: MediaService,
    private linkCache: LinkCache,
    config: ConfigService
  ) {
    this.fallbackUrl = config.get<string>('MEDIA_FALLBACK_URL');
  }

  private async checkPublicHost(url: string) {
    this.publicHostCheck ??= assertRemoteFileIsAccessible(url).catch(error => {
      this.publicHostCheck = undefined;
      throw error;
    });

    await this.publicHostCheck;
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
    const uriFromCache = await this.linkCache.get(cacheKey);

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

    const rejection = await this.linkCache.rejection(cacheKey);
    if (rejection) {
      throw new BadRequestException(rejection);
    }

    const { uri, exists } = await this.media
      .getImageUri(imageId, transformations)
      .catch(async error => {
        if (error instanceof BadRequestException) {
          await this.linkCache.reject(cacheKey, error.message);
        }
        throw error;
      });

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    await this.checkPublicHost(url);

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      if (!this.fallbackUrl) {
        await this.linkCache.set(
          cacheKey,
          { uri, exists: false },
          MISSING_LINK_TTL
        );
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
      extension: getExtensionForMimeType(uploadedFile.mimetype),
    });
  }

  @Get('document/:documentId/thumbnail')
  async getDocumentThumbnail(
    @Res() res: Response,
    @Req() req: Request,
    @Param('documentId') documentId: string
  ) {
    const safeId = sanitizeId(documentId);
    const cacheKey = `doc-thumb-${safeId}`;

    const uriFromCache = await this.linkCache.get(cacheKey);

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
      }
      res.redirect(
        httpCode,
        `${process.env['S3_PUBLIC_HOST']}/${uriFromCache.uri}`
      );
      return;
    }

    const { uri, exists } = await this.media.getDocumentThumbnailUri(safeId);

    if (!exists && this.fallbackUrl) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_FOUND, `${this.fallbackUrl}${(req as any).url}`);
      return;
    }

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      await this.linkCache.set(
        cacheKey,
        { uri, exists: false },
        MISSING_LINK_TTL
      );
      return;
    }

    await this.checkPublicHost(url);
    await this.linkCache.set(cacheKey, { uri, exists: true });
    this.setProductionCacheHeaders(res);
    res.redirect(HTTP_CODE_FOUND, url);
  }

  @Get('document/:documentId/:filename')
  async getDocumentWithFilename(
    @Res() res: Response,
    @Req() req: Request,
    @Param('documentId') documentId: string
  ) {
    return this.getDocument(res, req, documentId);
  }

  @Get('document/:documentId')
  async getDocument(
    @Res() res: Response,
    @Req() req: Request,
    @Param('documentId') documentId: string
  ) {
    const safeId = sanitizeId(documentId);
    const cacheKey = `doc-${safeId}`;

    const uriFromCache = await this.linkCache.get(cacheKey);

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
      }
      res.redirect(
        httpCode,
        `${process.env['S3_PUBLIC_HOST']}/${uriFromCache.uri}`
      );
      return;
    }

    const { uri, exists } = await this.media.getDocumentUri(safeId);

    if (!exists && this.fallbackUrl) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_FOUND, `${this.fallbackUrl}${(req as any).url}`);
      return;
    }

    const url = `${process.env['S3_PUBLIC_HOST']}/${uri}`;

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=600`);
      res.redirect(HTTP_CODE_NOT_FOUND, url);
      await this.linkCache.set(
        cacheKey,
        { uri, exists: false },
        MISSING_LINK_TTL
      );
      return;
    }

    await this.checkPublicHost(url);
    await this.linkCache.set(cacheKey, { uri, exists: true });
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
