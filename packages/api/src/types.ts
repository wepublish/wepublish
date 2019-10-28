export enum NavigationLinkType {
  Page = 'PageNavigationLink',
  Article = 'ArticleNavigationLink',
  External = 'ExternalNavigationLink'
}

export enum BlockType {
  // Content
  RichText = 'RichTextBlock',
  Gallery = 'gallery',
  Teaser = 'teaser',
  Embed = 'embed',
  Quote = 'quote',
  Image = 'ImageBlock',
  Listicle = 'listicle',
  PeerPageBreak = 'linkPageBreak',

  // Layout
  Grid = 'grid'
}

export enum ArticleVersionState {
  Draft = 'DRAFT',
  DraftReview = 'DRAFT_REVIEW',
  Published = 'PUBLISHED'
}
