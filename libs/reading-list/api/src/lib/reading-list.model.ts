import {ArgsType, Field, Int} from '@nestjs/graphql'

@ArgsType()
export class ReadingListProgressArgs {
  @Field()
  articleId!: string

  @Field(() => Int)
  blockIndex!: number

  @Field()
  completed?: boolean
}
