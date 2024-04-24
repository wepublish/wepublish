import {SlateNode} from '~/sdk/wep/classes/Slate'
import WepImage from '~/sdk/wep/models/image/WepImage'

export default class Listicle {
  public title?: string
  public richText?: SlateNode[]
  public image?: WepImage

  constructor({
    title,
    richText,
    image
  }: {
    title?: string
    richText?: SlateNode[]
    image?: WepImage
  }) {
    this.title = title
    this.richText = richText
    this.image = image ? new WepImage(image) : undefined
  }
}
