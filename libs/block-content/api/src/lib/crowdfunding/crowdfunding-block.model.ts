import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {Crowdfunding} from '@wepublish/crowdfunding/api'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class CrowdfundingBlock extends BaseBlock<typeof BlockType.Crowdfunding> {
  @Field({nullable: true})
  crowdfundingId?: string

  @Field(() => Crowdfunding, {nullable: true})
  crowdfunding?: Crowdfunding
}

@InputType()
export class CrowdfundingBlockInput extends OmitType(
  CrowdfundingBlock,
  ['crowdfunding', 'type'] as const,
  InputType
) {
  @Field({nullable: true})
  override crowdfundingId?: string
}
