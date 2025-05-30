import {Field, ObjectType} from '@nestjs/graphql'
import {PeerProfile} from './peer-profile.model.js'

@ObjectType('PeerV2')
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

  @Field(() => PeerProfile, {nullable: true})
  profile?: PeerProfile
}
