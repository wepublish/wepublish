import {Directive, Field, ObjectType, OmitType} from '@nestjs/graphql'
import {TagType} from './tag.types'

/**
 * Tag model with federation directives
 */
@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Tag {
  @Field()
  @Directive('@external')
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
