import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Comment } from '@wepublish/comments/api';

@ObjectType()
export class CommentBlockFilter {
  @Field({ nullable: true })
  item?: string;

  @Field(() => [String], { defaultValue: [], nullable: true })
  tags!: string[];

  @Field(() => [String], { defaultValue: [], nullable: true })
  comments!: string[];
}

@InputType()
export class CommentBlockFilterInput extends OmitType(
  CommentBlockFilter,
  [] as const,
  InputType
) {}

@ObjectType({
  implements: BaseBlock,
})
export class CommentBlock extends BaseBlock<typeof BlockType.Comment> {
  @Field(() => CommentBlockFilter)
  filter!: CommentBlockFilter;

  @Field(() => [Comment])
  comments!: Comment[];
}

@InputType()
export class CommentBlockInput extends OmitType(
  CommentBlock,
  ['filter', 'comments', 'type'] as const,
  InputType
) {
  @Field(() => CommentBlockFilterInput)
  filter!: CommentBlockFilterInput;
}
