import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class PollBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  // @Field(() => Poll)
  // poll!: Poll;
}

@InputType()
export class PollBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => ID, {nullable: true})
  pollId?: string
}
