import {Image, ImageTransformation, UploadImage} from './image'
import {FileUpload} from 'graphql-upload'

export interface MediaAdapter {
  uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>
  getImageURLForTransformation(image: Image, transformation: ImageTransformation): Promise<string>
}
