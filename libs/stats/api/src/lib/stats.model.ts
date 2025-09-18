import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Stats {
  @Field(type => Int)
  authorsCount!: number;

  @Field(type => Int)
  articlesCount!: number;

  @Field({ nullable: true })
  firstArticleDate?: Date;
}
