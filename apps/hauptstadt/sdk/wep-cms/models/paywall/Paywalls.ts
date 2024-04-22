import Paywall from '~/sdk/wep-cms/models/paywall/Paywall'
import {PaywallPosition} from '~/sdk/wep-cms/interfacesAndTypes/WepCms'

export default class Paywalls {
  public paywalls: Paywall[]
  public currentPaywallIndex: number
  public minimized: boolean

  constructor() {
    this.paywalls = []
    this.currentPaywallIndex = 0
    this.minimized = false
  }

  public parse({paywalls}: {paywalls: Paywall[]}): this {
    this.paywalls = []
    for (const paywall of paywalls) {
      this.paywalls.push(new Paywall(paywall))
    }
    return this
  }

  public hasPaywalls(): boolean {
    return !!this.paywalls.length
  }

  public isMinimized(): boolean {
    return this.minimized
  }

  public minimize(): void {
    this.minimized = true
  }

  public isResizable(): boolean {
    return !this.paywalls.find(
      paywall => paywall.position === 'articlePaywall' || paywall.position === 'articleEnd'
    )
  }

  public getCurrent(): undefined | Paywall {
    if (!this.paywalls.length) {
      return undefined
    }
    return this.paywalls[this.currentPaywallIndex]
  }

  public getNext(): undefined | Paywall {
    // set next paywall
    const maxIndex = this.paywalls.length
    this.currentPaywallIndex =
      this.currentPaywallIndex >= maxIndex - 1 ? 0 : this.currentPaywallIndex + 1
    return this.getCurrent()
  }

  public filterByPosition(position: PaywallPosition): Paywalls {
    const paywalls: Paywall[] = this.paywalls.filter(paywall => paywall.position === position)
    const paywallsInstance: Paywalls = new Paywalls()
    paywallsInstance.paywalls = paywalls
    return paywallsInstance
  }
}
