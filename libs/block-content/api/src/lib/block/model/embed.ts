import {Field, InputType, ObjectType} from '@nestjs/graphql'
import {GraphQLInt} from 'graphql/index'

@ObjectType()
export class EmbedBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String, {nullable: true})
  url?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => GraphQLInt, {nullable: true})
  width?: number

  @Field(() => GraphQLInt, {nullable: true})
  height?: number

  @Field(() => String, {nullable: true})
  styleCustom?: string

  @Field(() => String, {nullable: true})
  sandbox?: string
}

@InputType()
export class EmbedBlockInput extends EmbedBlock {}
