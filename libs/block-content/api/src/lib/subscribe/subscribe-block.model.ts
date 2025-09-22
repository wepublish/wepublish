import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock,
})
export class SubscribeBlock extends BaseBlock<typeof BlockType.Subscribe> {
  @Field(() => [String], {nullable: true})
  memberPlanIds?: string[]
}

@InputType()
export class SubscribeBlockInput extends OmitType(
  SubscribeBlock,
  ['type'] as const,
  InputType
) {}
