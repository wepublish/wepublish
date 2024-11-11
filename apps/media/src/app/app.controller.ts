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
    // Handle etag
    const etagClient = req.headers['if-none-match']
    if (etagClient) {
      const remoteEtag = await this.media.getRemoteEtag(
        `images/${imageId}/${getTransformationKey(transformations)}`
      )
      if (`"${remoteEtag}"` === etagClient) {
        res.status(304).end()
        return
      }
    }

    const [file, etag] = await this.media.getImage(imageId, transformations)
    res.setHeader('Content-Type', 'image/webp')

    if (process.env['NODE_ENV'] === 'production') {
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', `public, max-age=172800`) // cache for 48 hours and then re-checks the ETag
    }

    return file.pipe(res)
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.media.deleteImage(imageId)

    return res.sendStatus(204)
  }
}
