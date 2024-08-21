import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import {FileInterceptor} from '@nestjs/platform-express'
import {
  MediaService,
  TokenAuthGuard,
  TransformationsDto,
  SupportedImagesValidator
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
    @Param('imageId') imageId: string,
    @Query() transformations: TransformationsDto
  ) {
    const hasImage = await this.media.hasImage(imageId)

    if (!hasImage) {
      throw new NotFoundException()
    }

    const [file, stats] = await this.media.getImage(imageId, transformations)
    res.setHeader('Content-Type', 'image/webp')

    if (process.env['NODE_ENV'] === 'production') {
      res.setHeader('ETag', stats.etag)
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
