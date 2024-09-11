import {ArgsType, Field, Int} from '@nestjs/graphql'

@ArgsType()
export class PaginationArgs {
  @Field(type => Int)
  skip: number = 0

  @Field(type => Int)
  take: number = 10
}
