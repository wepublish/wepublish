import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 0 })
  skip!: number;

  @Field(() => Int, { defaultValue: 10 })
  take!: number;
}
