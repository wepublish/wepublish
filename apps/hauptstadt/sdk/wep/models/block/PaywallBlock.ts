import Block from '~/sdk/wep/models/block/Block'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'

export default class PaywallBlock extends Block {
  public paywalls: Paywalls
  constructor({__typename, paywalls}: PaywallBlock) {
    super({__typename})
    this.paywalls = paywalls
  }
}
