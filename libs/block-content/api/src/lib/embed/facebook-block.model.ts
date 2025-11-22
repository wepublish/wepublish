import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class FacebookPostBlock extends BaseBlock<
  typeof BlockType.FacebookPost
> {
  @Field({ nullable: true })
  userID?: string;

  @Field({ nullable: true })
  postID?: string;
}

@InputType()
export class FacebookPostBlockInput extends OmitType(
  FacebookPostBlock,
  ['type'] as const,
  InputType
) {}

@ObjectType({
  implements: BaseBlock,
})
export class FacebookVideoBlock extends BaseBlock<
  typeof BlockType.FacebookVideo
> {
  @Field({ nullable: true })
  userID?: string;

  @Field({ nullable: true })
  videoID?: string;
}

@InputType()
export class FacebookVideoBlockInput extends OmitType(
  FacebookVideoBlock,
  ['type'] as const,
  InputType
) {}
