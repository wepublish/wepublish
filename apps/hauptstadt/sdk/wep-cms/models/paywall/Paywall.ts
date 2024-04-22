import {PaywallPosition} from '~/sdk/wep-cms/interfacesAndTypes/WepCms'

export type PaywallType = {
  id: number
  position: PaywallPosition
  title?: string
  lead?: string
  subtitle?: string
  minimizedTitle?: string
}

export default class Paywall {
  public id: number
  public position: PaywallPosition
  public title?: string
  public lead?: string
  public subtitle?: string
  public minimizedTitle?: string

  constructor({id, position, title, lead, subtitle, minimizedTitle}: PaywallType) {
    this.id = id
    this.position = position
    this.title = title
    this.lead = lead
    this.subtitle = subtitle
    this.minimizedTitle = minimizedTitle
  }
}
