import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import Block from '~/sdk/wep/models/block/Block'
import RichTextBlock from '~/sdk/wep/models/block/RichTextBlock'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'
import ImageGalleryBlock from '~/sdk/wep/models/block/ImageGalleryBlock'
import ListicleBlock from '~/sdk/wep/models/block/ListicleBlock'
import QuoteBlock from '~/sdk/wep/models/block/QuoteBlock'
import EmbedBlock from '~/sdk/wep/models/block/EmbedBlock'
import TwitterTweetBlock from '~/sdk/wep/models/block/TwitterTweetBlock'
import InstagramPostBlock from '~/sdk/wep/models/block/InstagramPostBlock'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import PaywallBlock from '~/sdk/wep/models/block/PaywallBlock'
import YouTubeVideoBlock from '~/sdk/wep/models/block/YouTubeVideoBlock'
import PollBlock from '~/sdk/wep/models/block/PollBlock'
import CrowdfundingBlock from '~/sdk/wep/models/block/CrowdfundingBlock'
import HTMLBlock from '~/sdk/wep/models/block/HTMLBlock'

export type BlockTypes =
  | TeaserGridBlock
  | RichTextBlock
  | ImageBlock
  | TitleBlock
  | ImageGalleryBlock
  | ListicleBlock
  | QuoteBlock
  | EmbedBlock
  | TwitterTweetBlock
  | InstagramPostBlock
  | LinkPageBreakBlock
  | PaywallBlock
  | YouTubeVideoBlock
  | HTMLBlock
  | CrowdfundingBlock
  | PollBlock

export default class Blocks {
  public blocks: BlockTypes[]

  constructor() {
    this.blocks = []
  }

  parse<T extends Block>(blocks: T[]): Blocks {
    this.blocks = []
    for (const block of blocks) {
      switch (block.__typename) {
        case 'TeaserGridBlock':
          this.blocks.push(new TeaserGridBlock(block))
          break
        case 'RichTextBlock':
          this.blocks.push(new RichTextBlock(block))
          break
        case 'ImageBlock':
          this.blocks.push(new ImageBlock(block))
          break
        case 'TitleBlock':
          this.blocks.push(new TitleBlock(block))
          break
        case 'ImageGalleryBlock':
          this.blocks.push(new ImageGalleryBlock(block))
          break
        case 'ListicleBlock':
          this.blocks.push(new ListicleBlock(block))
          break
        case 'QuoteBlock':
          this.blocks.push(new QuoteBlock(block))
          break
        case 'EmbedBlock':
          this.blocks.push(new EmbedBlock(block))
          break
        case 'TwitterTweetBlock':
          this.blocks.push(new TwitterTweetBlock(block))
          break
        case 'InstagramPostBlock':
          this.blocks.push(new InstagramPostBlock(block))
          break
        case 'LinkPageBreakBlock':
          this.blocks.push(new LinkPageBreakBlock(block))
          break
        case 'YouTubeVideoBlock':
          this.blocks.push(new YouTubeVideoBlock(block))
          break
        case 'PollBlock':
          this.blocks.push(new PollBlock(block))
          break
        case 'HTMLBlock':
          this.blocks.push(new HTMLBlock(block))
          break
      }
    }
    return this
  }

  public cutTopBlockType(blockType: string, maxIndex = 1): BlockTypes | false {
    const blocksIndex: number = this.blocks.findIndex(
      (block: BlockTypes) => block.__typename === blockType
    )
    if (blocksIndex < 0 || blocksIndex > maxIndex) {
      return false
    }
    return this.blocks.splice(blocksIndex, 1)[0] || false
  }

  public removeBlocks(blocksLeft: number): void {
    while (this.blocks.length > blocksLeft) {
      this.blocks.pop()
    }
  }

  public getLastBlock(): BlockTypes {
    return this.blocks[this.blocks.length - 1]
  }
}
