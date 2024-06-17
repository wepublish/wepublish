import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class VimeoVideoBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  videoID!: string
}

@InputType()
export class VimeoVideoBlockInput extends VimeoVideoBlock {}
