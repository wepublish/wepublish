export enum VersionState {
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export enum BlockType {
  RichText = 'richText',
  Title = 'title',
  Image = 'image',
  ArticleTeaserGrid1 = 'articleTeaserGrid1',
  ArticleTeaserGrid6 = 'articleTeaserGrid6'
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

export interface ArticleReference {
  readonly id: string
  readonly title: string
  readonly image: ImageReference
}
