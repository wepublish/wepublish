import WepImage from '~/sdk/wep/models/image/WepImage'

export default class WepImages {
  public images: WepImage[]
  constructor() {
    this.images = []
  }

  public parse(images: WepImage[]): this {
    this.images = []
    for (const image of images) {
      this.images.push(new WepImage(image))
    }
    return this
  }
}
