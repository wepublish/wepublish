import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int)
  skip!: number;

  @Field(() => Int)
  take!: number;
}
