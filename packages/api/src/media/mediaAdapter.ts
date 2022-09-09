import {Image} from '@prisma/client'
import {FileUpload} from 'graphql-upload'
import {ImageTransformation, UploadImage} from '../db/image'

export interface ArrayBufferUpload {
  filename: string
  mimetype: string
  arrayBuffer: ArrayBuffer
}

export interface MediaAdapter {
  uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>
  uploadImageFromArrayBuffer(arrayBufferUpload: Promise<ArrayBufferUpload>): Promise<UploadImage>
  deleteImage(id: string): Promise<boolean>
  getImageURL(image: Image, transformation?: ImageTransformation): Promise<string>
}
