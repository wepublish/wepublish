export interface FocalPoint {
  readonly x: number
  readonly y: number
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
  readonly width?: string | null
  readonly height?: string | null
  readonly rotation?: ImageRotation | null
  readonly quality?: number | null
  readonly output?: ImageOutput | null
}

export interface EditableImageComponents {
  readonly filename?: string | null
  readonly title?: string | null
  readonly description?: string | null
  readonly tags: string[]

  readonly source?: string | null
  readonly link?: string | null
  readonly license?: string | null

  readonly focalPoint?: FocalPoint | null
}

export interface StaticImageComponents {
  readonly fileSize: number
  readonly extension: string
  readonly mimeType: string
  readonly format: string
  readonly width: number
  readonly height: number
}

export interface Image extends EditableImageComponents, StaticImageComponents {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly transformURL?: string | null
}

export type OptionalImage = Image | null

export interface UploadImage extends StaticImageComponents {
  readonly id: string
  readonly filename: string
}

export interface CreateImageArgs {
  readonly id: string
  readonly input: EditableImageComponents & StaticImageComponents
}

export interface UpdateImageArgs {
  readonly id: string
  readonly input: EditableImageComponents
}

export enum ImageSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface ImageFilter {
  readonly title?: string
  readonly tags?: string[]
}

export interface DBImageAdapter {
  createImage(args: CreateImageArgs): Promise<OptionalImage>
  updateImage(args: UpdateImageArgs): Promise<OptionalImage>
}
