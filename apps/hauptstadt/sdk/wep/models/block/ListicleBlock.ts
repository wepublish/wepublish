import {gql} from 'graphql-tag'
import Block, {BlockProps} from '~/sdk/wep/models/block/Block'
import Listicle from '~/sdk/wep/models/block/Listicle'
import WepImage from '~/sdk/wep/models/image/WepImage'

export interface ListicleBlockProps extends BlockProps {
  items?: Listicle[]
}

export default class ListicleBlock extends Block {
  public items?: Listicle[]

  constructor({__typename, items}: ListicleBlockProps) {
    super({__typename})
    this.items = []
    if (items) {
      this.parse(items)
    }
  }

  public parse(items: Listicle[]): this {
    this.items = []
    for (const item of items) {
      this.items.push(new Listicle(item))
    }
    return this
  }

  public static listicleBlockFragment = gql`
    fragment listicleBlock on ListicleBlock {
      items {
        title
        image {
          ...image
        }
        richText
      }
    }
    ${WepImage.wepImageFragment}
  `
}
