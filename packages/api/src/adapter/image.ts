export interface Image {
  readonly id: string
  readonly filename: string
  readonly fileSize: number
  readonly extension: string
  readonly mimeType: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly url: string
  readonly format: string
  readonly width: number
  readonly height: number
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
  readonly url: string
  readonly format: string
  readonly width: number
  readonly height: number
}

export interface ImageTransformation {}
