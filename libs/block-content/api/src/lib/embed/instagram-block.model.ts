import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class InstagramPostBlock extends BaseBlock<
  typeof BlockType.InstagramPost
> {
  @Field({ nullable: true })
  postID?: string;
}

@InputType()
export class InstagramPostBlockInput extends OmitType(
  InstagramPostBlock,
  ['type'] as const,
  InputType
) {}
