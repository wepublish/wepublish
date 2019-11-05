export interface Point {
  readonly x: number
  readonly y: number
}

export interface Image {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly filename: string
  readonly fileSize: number
  readonly extension: string
  readonly mimeType: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly format: string
  readonly width: number
  readonly height: number
  readonly focalPoint?: Point
}

export interface ImageEdge {
  readonly description: string
  readonly imageID: string
}

export interface UploadImage {
  readonly id: string
  readonly filename: string
  readonly fileSize: number
  readonly extension: string
  readonly mimeType: string
  readonly format: string
  readonly width: number
  readonly height: number
}

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
  readonly width?: string
  readonly height?: string
  readonly rotation?: ImageRotation
  readonly quality?: number
  readonly output?: ImageOutput
}
