import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class HTMLBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  html?: string
}

@InputType()
export class HTMLBlockInput extends HTMLBlock {}
