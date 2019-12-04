import {Image, ImageTransformation, UploadImage} from './image'
import {FileUpload} from 'graphql-upload'

export interface MediaAdapter {
  uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>
  getImageURL(image: Image, transformation?: ImageTransformation): Promise<string>
}
