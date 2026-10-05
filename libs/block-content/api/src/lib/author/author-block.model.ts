import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { Author, HasOptionalAuthor } from '@wepublish/author/api';

@ObjectType({
  implements: () => [BaseBlock, HasOptionalAuthor],
})
export class AuthorBlock
  extends BaseBlock<typeof BlockType.Author>
  implements HasOptionalAuthor
{
  authorId?: string;
  author?: Author;
}

@InputType()
export class AuthorBlockInput extends OmitType(
  AuthorBlock,
  ['author', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override authorId?: string;
}
