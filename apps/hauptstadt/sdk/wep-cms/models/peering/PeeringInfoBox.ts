export type PeeringInfoBoxType = {
  id: number
  title?: string
  text?: string
}

export default class PeeringInfoBox {
  public id: number
  public title?: string
  public text?: string

  constructor({id, title, text}: PeeringInfoBoxType) {
    this.id = id
    this.title = title
    this.text = text
  }
}
