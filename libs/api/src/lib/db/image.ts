import { Image } from '@prisma/client';

export interface ImageWithTransformURL extends Image {
  readonly transformURL?: string;
}

export enum ImageSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
}

export interface ImageFilter {
  readonly title?: string;
  readonly tags?: string[];
}
