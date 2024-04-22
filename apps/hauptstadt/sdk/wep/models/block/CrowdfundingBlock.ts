import Block from '~/sdk/wep/models/block/Block'
export default class CrowdfundingBlock extends Block {
  public directusCrowdfundingId?: number

  constructor({__typename, directusCrowdfundingId}: CrowdfundingBlock) {
    super({__typename})
    this.directusCrowdfundingId = directusCrowdfundingId
  }
}
