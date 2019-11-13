export enum VersionState {
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export interface ImageTransformation {
  readonly width?: number
  readonly height?: number
}

export interface ImageReference {
  readonly id: string
  readonly url: string
  readonly width: number
  readonly height: number
}
