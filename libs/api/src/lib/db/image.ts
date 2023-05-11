import {FocalPoint, Image} from '@prisma/client'

export interface ImageWithTransformURL extends Image {
  readonly transformURL?: string | null
}

export enum ImageSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface ImageFilter {
  readonly title?: string
  readonly tags?: string[]
}

export type ImageWithFocalPoint = Image & {focalPoint: FocalPoint}
