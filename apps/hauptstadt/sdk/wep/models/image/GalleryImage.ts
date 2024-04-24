import WepImage from '~/sdk/wep/models/image/WepImage'

export default class GalleryImage {
  public image?: WepImage
  public caption?: string
  constructor({image, caption}: GalleryImage) {
    this.image = image ? new WepImage(image) : undefined
    this.caption = caption
  }
}
