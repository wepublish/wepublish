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
  UseInterceptors
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
  constructor(
    private readonly media: MediaService,
    private readonly imageCacheService: ImageCacheService
  ) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    res.status(200).send({status: 'ok'})
  }

  @Get('/cacheState')
  async cacheState(@Res() res: Response) {
    const state = this.imageCacheService.state()
    res.status(state.healty ? 200 : 500).send(state.stats)
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

    if (cachedBuffer) {
      const etag = this.media.generateETag(cachedBuffer)

      // Handle ETag
      if (req.headers['if-none-match'] === `"${etag}"`) {
        res.status(304).end()
        return
      }

      res.setHeader('Content-Type', 'image/webp')
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', `public, max-age=172800`)
      res.end(cachedBuffer)
      return
    }

    // Not in cache, fetch and process image
    const [file, etag, imageExists] = await this.media.getImage(imageId, transformations)
    res.setHeader('Content-Type', 'image/webp')

    if (process.env['NODE_ENV'] === 'production') {
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', `public, max-age=172800`)
    }
    const buffer = await this.media.bufferStream(file)

    if (!imageExists) {
      res.status(404)
      res.setHeader('Cache-Control', `public, max-age=60`) // 1 min cache for 404, optional
      this.imageCacheService.set(cacheKey, buffer)
    } else {
      // Buffer the file to store in cache
      const sizeKB = buffer.length / 1024
      const ttl = sizeKB > 200 ? 300 : 3600 // >200KB → 5 min, else 60 min
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
