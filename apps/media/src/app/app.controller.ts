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
  TokenAuthGuard,
} from '@wepublish/media/api';
import {
  getTransformationKey,
  removeSignatureFromTransformations,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { Response } from 'express';
import 'multer';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { assertRemoteFileIsAccessible } from './assertRemoteFileIsAccessible';

const HTTP_CODE_FOUND = 301;
const HTTP_CODE_NOT_FOUND = 307;
let S3_HOST_CHECKED = false;

@Controller({
  version: '1',
})
export class AppController {
  constructor(
    private media: MediaService,
    @Inject(CACHE_MANAGER) private linkCache: Cache
  ) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    res.status(200).send({ status: 'ok' });
  }

  @Get('/favicon.ico')
  async favicon(@Res() res: Response) {
    throw new NotFoundException();
  }

  @UseGuards(TokenAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Res() res: Response,
    @Query('imageId') imageId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [],
      })
    )
    uploadedFile: Express.Multer.File
  ) {
    if (!imageId) {
      imageId = uuidv4();
    }
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

    if (process.env['NODE_ENV'] === 'production') {
      // max-age = 12hours, immutable, stale-if-error = 7days, stale-while-revalidate = 1day
      res.setHeader(
        'Cache-Control',
        `public, max-age=43200, immutable, stale-if-error=604800, stale-while-revalidate=86400`
      );
    }

    if (uriFromCache) {
      let httpCode = HTTP_CODE_FOUND;
      if (!uriFromCache.exists) {
        res.setHeader('Cache-Control', `public, max-age=600`);
        httpCode = HTTP_CODE_NOT_FOUND;
      } else {
        // On access refresh cache ttl
        await this.linkCache.set(cacheKey, uriFromCache);
      }
      res.redirect(
        httpCode,
        `${process.env['S3_PUBLIC_HOST']}/${uriFromCache.uri}`
      );
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
      await this.linkCache.set(cacheKey, { uri, exists: false }, 14400);
      return;
    } else {
      await this.linkCache.set(cacheKey, { uri, exists: true });
    }

    res.redirect(HTTP_CODE_FOUND, url);
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.media.deleteImage(imageId);

    return res.sendStatus(204);
  }
}
