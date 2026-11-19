import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Author } from '@wepublish/author/api';

import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

/** A title and a list of chosen authors, e.g. the team or a board */
@ObjectType({
  implements: BaseBlock,
})
export class AuthorsBlock extends BaseBlock<typeof BlockType.Authors> {
  @Field({ nullable: true })
  title?: string;

  @Field(() => [String], { defaultValue: [] })
  authorIds!: string[];

  @Field(() => [Author])
  authors!: Author[];
}

@InputType()
export class AuthorsBlockInput extends OmitType(
  AuthorsBlock,
  ['authors', 'type'] as const,
  InputType
) {}
