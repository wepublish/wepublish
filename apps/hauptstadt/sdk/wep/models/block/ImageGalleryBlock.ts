import {gql} from 'graphql-tag'
import Block, {BlockProps} from '~/sdk/wep/models/block/Block'
import GalleryImage from '~/sdk/wep/models/image/GalleryImage'
import WepImage from '~/sdk/wep/models/image/WepImage'

export interface ImageGalleryBlockProps extends BlockProps {
  images?: GalleryImage[]
}

export default class ImageGalleryBlock extends Block {
  public images?: GalleryImage[]
  constructor({__typename, images}: ImageGalleryBlockProps) {
    super({__typename})
    this.images = []
    if (images) {
      this.parse(images)
    }
  }

  public parse(images: GalleryImage[]): this {
    this.images = []
    for (const image of images) {
      this.images.push(new GalleryImage(image))
    }
    return this
  }

  public static imageGalleryBlockFragment = gql`
    fragment imageGalleryBlock on ImageGalleryBlock {
      images {
        caption
        image {
          ...image
        }
      }
    }
    ${WepImage.wepImageFragment}
  `
}
