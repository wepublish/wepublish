import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { CrowdfundingWithActiveGoal } from '@wepublish/crowdfunding/api';
import { BlockType } from '../block-type.model';
import { HasOptionalCrowdfunding } from '@wepublish/crowdfunding/api';

@ObjectType({
  implements: [BaseBlock, HasOptionalCrowdfunding],
})
export class CrowdfundingBlock extends BaseBlock<
  typeof BlockType.Crowdfunding
> {
  @Field({ nullable: true })
  crowdfundingId?: string;

  @Field(() => CrowdfundingWithActiveGoal, { nullable: true })
  crowdfunding?: CrowdfundingWithActiveGoal;
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
