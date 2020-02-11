export interface FocalPoint {
  readonly x: number
  readonly y: number
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
  readonly updatedAt: Date
}

export interface CreateImageArgs extends EditableImageComponents, StaticImageComponents {
  readonly id: string
}

export interface UpdateImageArgs extends EditableImageComponents, StaticImageComponents {
  readonly id: string
}

export type OptionalImage = Image | null

export interface DBImageAdapter {
  createImage(args: CreateImageArgs): Promise<OptionalImage>
  updateImage(args: UpdateImageArgs): Promise<OptionalImage>
  deleteImage(id: string): Promise<boolean>
  getImagesByID(ids: readonly string[]): Promise<OptionalImage[]>
}
