import {Field, ObjectType, InputType} from '@nestjs/graphql'
import {Consent} from '../consent/consent.model'
import {User} from '@wepublish/user/api'
import {User as UserType} from '@prisma/client'

@ObjectType()
export class UserConsent {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field(type => Consent)
  consent!: Consent

  @Field(type => User)
  user!: UserType

  @Field()
  value!: boolean
}

@InputType()
export class UserConsentInput {
  @Field()
  consentId!: string

  @Field()
  userId!: string

  @Field()
  value!: boolean
}

@InputType()
export class UpdateUserConsentInput {
  @Field()
  value!: boolean
}

@InputType()
export class UserConsentFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  slug?: string

  @Field({nullable: true})
  value?: boolean
}
