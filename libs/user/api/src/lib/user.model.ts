import {Directive, Field, ObjectType} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field()
  @Directive('@external')
  id!: string

  @Field()
  email!: string

  @Field({nullable: true})
  emailVerifiedAt?: Date

  @Field()
  name!: string

  @Field({nullable: true})
  firstName?: string

  @Field({nullable: true})
  lastLogin?: Date

  @Field(type => [String], {nullable: true})
  roleIDs?: string[]

  @Field({nullable: true})
  userImageID?: string
}
