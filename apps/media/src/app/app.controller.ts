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
import NodeCache from 'node-cache'

const imageMemoryCache = new NodeCache({
  stdTTL: 60 * 60,
  checkperiod: 60,
  deleteOnExpire: true,
  useClones: true
})

@Controller({
  version: '1'
})
export class AppController {
  constructor(private readonly media: MediaService) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    res.status(200).send({status: 'ok'})
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
    const cachedBuffer = imageMemoryCache.get<Buffer>(cacheKey)

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
      imageMemoryCache.set(cacheKey, buffer, 60)
    } else {
      // Buffer the file to store in cache
      imageMemoryCache.set(cacheKey, buffer)
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
