import {Injectable} from '@nestjs/common'
import {Image} from '@prisma/client'
import {FileUpload} from 'graphql-upload'
import {ImageTransformation, UploadImage} from './image-upload'

export interface ArrayBufferUpload {
  filename: string
  mimetype: string
  arrayBuffer: ArrayBuffer
}

@Injectable()
export abstract class MediaAdapter {
  abstract uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>

  abstract uploadImageFromArrayBuffer(
    arrayBufferUpload: Promise<ArrayBufferUpload>
  ): Promise<UploadImage>

  abstract deleteImage(id: string): Promise<boolean>

  abstract getImageURL(
    image: Image,
    transformation?: ImageTransformation | undefined
  ): Promise<string>
}
