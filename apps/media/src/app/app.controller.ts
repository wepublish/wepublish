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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
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
import NodeCache from 'node-cache';

const linkCache = new NodeCache({
  checkperiod: 60,
  deleteOnExpire: true,
  useClones: true,
  stdTTL: 3000,
});

@Controller({
  version: '1',
})
export class AppController {
  constructor(private media: MediaService) {}

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
        validators: [new SupportedImagesValidator()],
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
    const linkFromCache: [string, number] = linkCache.get(cacheKey);

    res.setHeader('Content-Type', 'image/webp');

    if (process.env['NODE_ENV'] === 'production') {
      // max-age = 365days, immutable, stale-if-error = 30days, stale-while-revalidate = 1day
      res.setHeader(
        'Cache-Control',
        `public, max-age=31536000, immutable, stale-if-error=2592000, stale-while-revalidate=86400`
      );
    }

    if (linkFromCache) {
      if (linkFromCache[1] !== 301) {
        res.setHeader('Cache-Control', `public, max-age=60`); // 1 min cache for 404, optional
      }
      res.redirect(
        linkFromCache[1],
        `${process.env['S3_PUBLIC_HOST']}/${linkFromCache[0]}`
      );
      return;
    }

    const { uri, exists } = await this.media.getImageUri(
      imageId,
      transformations
    );

    if (!exists) {
      res.setHeader('Cache-Control', `public, max-age=60`);
      res.redirect(404, `${process.env['S3_PUBLIC_HOST']}/${uri}`);
      linkCache.set(cacheKey, [uri, 404], 120);
    } else {
      linkCache.set(cacheKey, [uri, 301]);
    }

    res.redirect(301, `${process.env['S3_PUBLIC_HOST']}/${uri}`);
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.media.deleteImage(imageId);

    return res.sendStatus(204);
  }
}
