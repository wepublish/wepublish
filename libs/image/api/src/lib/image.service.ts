import {Injectable} from '@nestjs/common'
import {MediaAdapter} from './media-adapter'
import {PrismaClient} from '@prisma/client'
import {UploadImageInput} from './image.model'

@Injectable()
export class ImageService {
  constructor(readonly prisma: PrismaClient, readonly mediaAdapter: MediaAdapter) {}

  async uploadNewImage(uploadImageInput: UploadImageInput) {
    const {file, filename, title, description, tags, source, link, license, focalPoint} =
      uploadImageInput
    const {id, ...image} = await this.mediaAdapter.uploadImage(file)
    return this.prisma.image.create({
      data: {
        id,
        ...image,
        filename: filename ?? image.filename,
        title,
        description,
        tags,
        source,
        link,
        license,
        focalPoint: {
          create: focalPoint
        }
      }
    })
  }

  async replaceImage(imageId: string, uploadImageInput: UploadImageInput) {
    const {file, filename, title, description, tags, source, link, license, focalPoint} =
      uploadImageInput
    const {id, ...image} = await this.mediaAdapter.uploadImage(file)
    return this.prisma.image.update({
      where: {
        id: imageId
      },
      data: {
        id,
        ...image,
        filename: filename ?? image.filename,
        title,
        description,
        tags,
        source,
        link,
        license,
        focalPoint: {
          create: focalPoint
        }
      }
    })
  }

  async deleteImage(imageId: string) {
    await this.mediaAdapter.deleteImage(imageId)
    await this.prisma.image.delete({where: {id: imageId}})
  }
}
