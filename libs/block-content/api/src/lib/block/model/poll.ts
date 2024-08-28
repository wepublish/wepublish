import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'

@ObjectType()
export class PollBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => ID, {nullable: true})
  pollId?: string

  // @Field(() => Poll)
  // poll!: Poll;
}

@InputType()
export class PollBlockInput extends OmitType(PollBlock, []) {}
