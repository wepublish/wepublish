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
  NotFoundException
} from '@nestjs/common'
import {FileInterceptor} from '@nestjs/platform-express'
import {
  getTransformationKey,
  MediaService,
  SupportedImagesValidator,
  TokenAuthGuard,
  TransformationsDto
} from '@wepublish/media/api'
import {Response} from 'express'
import 'multer'
import {v4 as uuidv4} from 'uuid'
import {ImageCacheService} from './imageCache.service'

@Controller({
  version: '1'
})
export class AppController {
  constructor(private media: MediaService, private imageCacheService: ImageCacheService) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    res.status(200).send({status: 'ok'})
  }

  @Get('/cacheState')
  async cacheState(@Res() res: Response) {
    const state = this.imageCacheService.state()
    res.status(state.healty ? 200 : 500).send(state.stats)
  }

  @Get('/favicon.ico')
  async favicon(@Res() res: Response) {
    throw new NotFoundException()
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
        validators: [new SupportedImagesValidator()]
      })
    )
    uploadedFile: Express.Multer.File
  ) {
    if (!imageId) {
      imageId = uuidv4()
    }
    const metadata = await this.media.saveImage(imageId, uploadedFile.buffer)

    res.status(201).send({
      id: imageId,
      filename: `${imageId}`,
      fileSize: metadata.size,
      mimeType: `image/${metadata.format}`,
      format: metadata.format,
      extension: `.${metadata.format}`,
      width: metadata.width,
      height: metadata.height
    })
  }

  @Get(':imageId')
  async transformImage(
    @Res() res: Response,
    @Req() req: Request,
    @Param('imageId') imageId: string,
    @Query() transformations: TransformationsDto
  ) {
    const cacheKey = `${imageId}-${getTransformationKey(transformations)}`

    // Check if image is cached
    const cachedBuffer = this.imageCacheService.get(cacheKey)

    res.setHeader('Content-Type', 'image/webp')

    if (process.env['NODE_ENV'] === 'production') {
      // max-age = 365days, immutable, stale-if-error = 30days, stale-while-revalidate = 1day
      res.setHeader(
        'Cache-Control',
        `public, max-age=31536000, immutable, stale-if-error=2592000, stale-while-revalidate=86400`
      )
    }

    if (cachedBuffer[0]) {
      if (cachedBuffer[1] !== 200) {
        res.setHeader('Cache-Control', `public, max-age=60`) // 1 min cache for 404, optional
      }
      res.status(cachedBuffer[1])
      res.end(cachedBuffer[0])
      return
    }

    // Not in cache, fetch and process image
    const [file, imageExists] = await this.media.getImage(imageId, transformations)

    const buffer = await this.media.bufferStream(file)

    if (!imageExists) {
      res.status(404)
      res.setHeader('Cache-Control', `public, max-age=60`) // 1 min cache for 404, optional
      this.imageCacheService.set(cacheKey, buffer, 404, 120)
    } else {
      this.imageCacheService.set(cacheKey, buffer)
    }

    res.end(buffer)
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.media.deleteImage(imageId)

    return res.sendStatus(204)
  }
}
