import {Field, ObjectType, OmitType} from '@nestjs/graphql'
import {TagType} from './tag.types'

@ObjectType()
export class Tag {
  @Field()
  id!: string

  @Field(() => String, {nullable: true})
  tag?: string | null

  @Field(() => TagType, {nullable: true})
  type?: TagType

  @Field()
  main!: boolean

  @Field()
  url!: string
}

export class TagFields extends OmitType(Tag, ['url']) {}
