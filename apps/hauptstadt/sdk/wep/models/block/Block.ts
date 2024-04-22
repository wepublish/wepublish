export type BlockTypename =
  | 'TeaserGridBlock'
  | 'RichTextBlock'
  | 'ImageBlock'
  | 'TitleBlock'
  | 'ImageGalleryBlock'
  | 'ListicleBlock'
  | 'QuoteBlock'
  | 'EmbedBlock'
  | 'TwitterTweetBlock'
  | 'InstagramPostBlock'
  | 'LinkPageBreakBlock'
  | 'YouTubeVideoBlock'
  | 'PollBlock'
  | 'HTMLBlock'
  // custom directus blocks
  | 'CrowdfundingBlock'
  | 'PaywallBlock'

export interface BlockProps {
  __typename: BlockTypename
}

export default class Block {
  public __typename: BlockTypename

  constructor({__typename}: BlockProps) {
    this.__typename = __typename
  }
}
