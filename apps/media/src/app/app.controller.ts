import {
  Controller,
  Delete,
  Get,
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
import {TokenAuthGuard} from '@wepublish/media/api'
import {Response} from 'express'
import 'multer'
import {v4 as uuidv4} from 'uuid'
import {AppService} from './app.service'
import {SupportedImagesValidator} from './supported-images-validator'
import {TransformationsDto} from './transformations.dto'

@Controller({
  version: '1'
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(TokenAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Res() res: Response,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new SupportedImagesValidator()]
      })
    )
    uploadedFile: Express.Multer.File
  ) {
    const imageId = uuidv4()
    const metadata = await this.appService.saveImage(imageId, uploadedFile.buffer)

    res.status(201).send({
      id: imageId,
      filename: `${imageId}.webp`,
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
    const [file, stats] = await this.appService.getData(imageId, transformations)
    res.setHeader('Content-Type', 'image/webp')
    // res.setHeader('ETag', stats.etag)
    // res.setHeader('Cache-Control', `public, max-age=172800`) // cache for 48 hours and then re-checks the ETag

    return file.pipe(res)
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':imageId')
  async deleteImage(@Res() res: Response, @Param('imageId') imageId: string) {
    await this.appService.deleteImage(imageId)

    return res.sendStatus(204)
  }
}
