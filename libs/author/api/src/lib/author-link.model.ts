import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthorLink {
  @Field()
  title!: string;

  @Field()
  url!: string;
}
