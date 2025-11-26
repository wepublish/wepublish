import { ArgsType, Field, ObjectType } from '@nestjs/graphql';

@ArgsType()
export class QueryArgs {
  @Field()
  query!: string;

  @Field({ nullable: true })
  chatId?: string;
}

@ObjectType()
export class Chat {
  @Field()
  chatId: string;

  @Field()
  message: string;
}
