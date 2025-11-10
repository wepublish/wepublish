import { Field, InterfaceType } from '@nestjs/graphql';
import { Author } from '../author.model';

@InterfaceType()
export abstract class HasOptionalAuthor {
  @Field({ nullable: true })
  authorId?: string;

  @Field(() => Author, { nullable: true })
  author?: Author;
}

@InterfaceType()
export abstract class HasAuthor {
  @Field()
  authorId!: string;

  @Field(() => Author)
  author!: Author;
}
