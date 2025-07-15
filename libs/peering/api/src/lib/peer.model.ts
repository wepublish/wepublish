import {Field, ObjectType} from '@nestjs/graphql'
import {PeerProfile} from './peer-profile.model.js'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Descendant} from 'slate'

@ObjectType()
export class Peer {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(() => Boolean, {nullable: true})
  isDisabled?: boolean

  @Field()
  hostURL!: string

  @Field(() => GraphQLRichText, {nullable: true})
  information?: Descendant[]

  @Field(() => PeerProfile, {nullable: true})
  profile?: PeerProfile
}
