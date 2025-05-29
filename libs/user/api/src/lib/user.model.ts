import {Directive, Field, ObjectType} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field()
  @Directive('@external')
  id!: string
}

@ObjectType()
export class UserV2 {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  email!: string

  @Field({nullable: true})
  emailVerifiedAt?: Date

  @Field()
  name!: string

  @Field({nullable: true})
  firstName?: string

  @Field({nullable: true})
  preferredName?: string

  @Field()
  password!: string

  @Field()
  active!: boolean

  @Field({nullable: true})
  lastLogin?: Date

  @Field(type => [String])
  roleIDs!: string[]

  @Field({nullable: true})
  userImageID?: string
}
