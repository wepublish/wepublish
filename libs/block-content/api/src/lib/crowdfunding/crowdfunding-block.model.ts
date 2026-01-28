import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { Crowdfunding } from '@wepublish/crowdfunding/api';
import { BlockType } from '../block-type.model';
import { HasOptionalCrowdfunding } from '@wepublish/crowdfunding/api';

@ObjectType({
  implements: () => [BaseBlock, HasOptionalCrowdfunding],
})
export class CrowdfundingBlock
  extends BaseBlock<typeof BlockType.Crowdfunding>
  implements HasOptionalCrowdfunding
{
  crowdfundingId?: string;
  crowdfunding?: Crowdfunding;
}

@InputType()
export class CrowdfundingBlockInput extends OmitType(
  CrowdfundingBlock,
  ['crowdfunding', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override crowdfundingId?: string;
}
