import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class PolisConversationBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  conversationID!: string
}

@InputType()
export class PolisConversationBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  conversationID!: string
}
