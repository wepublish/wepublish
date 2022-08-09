import {Image} from '@prisma/client'

export enum ImageRotation {
  Auto = 'auto',
  Rotate0 = '0',
  Rotate90 = '90',
  Rotate180 = '180',
  Rotate270 = '270'
}

export enum ImageOutput {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp'
}

export interface ImageTransformation {
  readonly width?: string | null
  readonly height?: string | null
  readonly rotation?: ImageRotation | null
  readonly quality?: number | null
  readonly output?: ImageOutput | null
}

export interface ImageWithTransformURL extends Image {
  readonly transformURL?: string | null
}

export type UploadImage = Pick<
  Image,
  'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType' | 'format' | 'width' | 'height'
>

export enum ImageSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface ImageFilter {
  readonly title?: string
  readonly tags?: string[]
}
