import {SortOrder, InputCursor, Limit, ConnectionResult} from './common'

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
  readonly width?: string
  readonly height?: string
  readonly rotation?: ImageRotation
  readonly quality?: number
  readonly output?: ImageOutput
}

export interface EditableImageComponents {
  readonly filename?: string
  readonly title?: string
  readonly description?: string
  readonly tags: string[]

  readonly author?: string
  readonly source?: string
  readonly license?: string

  readonly focalPoint?: FocalPoint
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

  readonly transformURL?: string
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

export interface DeleteImageArgs {
  readonly id: string
}

export enum ImageSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface ImageFilter {
  readonly title?: string
  readonly tags?: string[]
}

export interface GetImagesArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: ImageFilter
  readonly sort: ImageSort
  readonly order: SortOrder
}

export interface DBImageAdapter {
  createImage(args: CreateImageArgs): Promise<OptionalImage>
  updateImage(args: UpdateImageArgs): Promise<OptionalImage>
  deleteImage(args: DeleteImageArgs): Promise<boolean | null>
  getImagesByID(ids: readonly string[]): Promise<OptionalImage[]>
  getImages(args: GetImagesArgs): Promise<ConnectionResult<Image>>
}
