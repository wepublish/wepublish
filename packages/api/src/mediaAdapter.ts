import {Image, ImageTransformation, UploadImage} from './db/image'
import {FileUpload} from 'graphql-upload'

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
