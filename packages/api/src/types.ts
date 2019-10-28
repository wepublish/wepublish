export enum NavigationLinkType {
  Page = 'PageNavigationLink',
  Article = 'ArticleNavigationLink',
  External = 'ExternalNavigationLink'
}

export enum BlockType {
  // Content
  RichText = 'RichTextBlock',
  Gallery = 'GalleryBlock',
  Teaser = 'TeaserBlock',
  Embed = 'EmbedBlock',
  Quote = 'QuoteBlock',
  Image = 'ImageBlock',
  Listicle = 'ListicleBlock',
  PeerPageBreak = 'PeerPageBreakBlock',

  // Layout
  ArticleGrid = 'ArticleGridBlock'
}

export enum ArticleVersionState {
  Draft = 'DRAFT',
  DraftReview = 'DRAFT_REVIEW',
  Published = 'PUBLISHED'
}
