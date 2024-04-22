import {gql} from 'graphql-tag'
import Block from '~/sdk/wep/models/block/Block'

export default class EmbedBlock extends Block {
  public url?: string
  public title?: string
  public width?: number
  public height?: number
  public styleCustom?: string

  constructor({__typename, url, title, width, height, styleCustom}: EmbedBlock) {
    super({__typename})
    this.url = url
    this.title = title
    this.width = width
    this.height = height
    this.styleCustom = styleCustom
  }

  public static embedBlockFragment = gql`
    fragment embedBlock on EmbedBlock {
      url
      title
      width
      height
      styleCustom
    }
  `
}
