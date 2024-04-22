import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'

export default class QuoteBlock extends Block {
  public quote?: string
  public author?: string
  constructor({__typename, quote, author}: QuoteBlock) {
    super({__typename})
    this.quote = quote
    this.author = author
  }

  public static quoteBlockFragment = gql`
    fragment quoteBlock on QuoteBlock {
      quote
      author
    }
  `
}
