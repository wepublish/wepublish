import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class TitleBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}

@InputType()
export class TitleBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}
