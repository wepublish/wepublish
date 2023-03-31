import {Field, ObjectType, InputType, registerEnumType} from '@nestjs/graphql'
import {Consent} from '../consent/consent.model'
import {User} from '@wepublish/user/api'
import {ConsentValue, User as UserType} from '@prisma/client'

registerEnumType(ConsentValue, {
  name: 'ConsentValue'
})

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

  @Field()
  consentId!: string

  @Field(type => User)
  user!: UserType

  @Field()
  userId!: string

  @Field(type => ConsentValue)
  value!: ConsentValue
}

@InputType()
export class UserConsentInput {
  @Field()
  consentId!: string

  @Field()
  userId!: string

  @Field(type => ConsentValue)
  value!: ConsentValue
}

@InputType()
export class UpdateUserConsentInput {
  @Field(type => ConsentValue)
  value!: ConsentValue
}

@InputType()
export class UserConsentFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  slug?: string

  @Field(type => ConsentValue, {nullable: true})
  value?: ConsentValue
}
