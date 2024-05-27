import {ObjectType, Field, InputType, ArgsType, ID, registerEnumType, Int} from '@nestjs/graphql'
import {PermissionObject} from '@wepublish/permissions/api'
import {PaginatedType} from '@wepublish/utils/api'

@ObjectType()
export class UserRole {
  @Field(() => String)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String, {nullable: true})
  description?: string

  @Field(() => Boolean)
  systemRole!: boolean

  @Field(() => [String])
  permissionIDs!: string[]

  @Field(() => [PermissionObject], {nullable: true})
  permissions!: PermissionObject[]
}

@ObjectType()
export class PaginatedUserRoles extends PaginatedType(UserRole) {}

@InputType()
export class UserRoleFilter {
  @Field(() => String, {nullable: true})
  name?: string
}

@InputType()
export class UserRoleInput {
  @Field(() => String)
  name!: string

  @Field(() => String)
  description!: string

  @Field(() => [String])
  permissionIDs!: string[]
}

export enum UserRoleSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

registerEnumType(UserRoleSort, {
  name: 'UserRoleSort'
})

@ArgsType()
export class UserRoleIdArgs {
  @Field(() => ID)
  id!: string
}

@ArgsType()
export class GetUserRolesArgs {
  @Field({nullable: true})
  filter?: UserRoleFilter

  @Field(() => ID, {nullable: true})
  cursorId?: string

  @Field(() => Int, {nullable: true})
  skip?: number

  @Field(() => Int, {nullable: true})
  take?: number
}

@InputType()
export class CreateUserRoleInput {
  @Field()
  name!: string

  @Field(() => [String])
  permissionIDs!: string[]
}

@ArgsType()
export class CreateUserRoleArgs {
  @Field(returns => CreateUserRoleInput)
  userRole!: CreateUserRoleInput
}

@InputType()
export class UpdateUserRoleInput {
  @Field()
  id!: string

  @Field({nullable: true})
  name?: string

  @Field(() => [String], {nullable: true})
  permissionIDs?: string[]
}

@ArgsType()
export class UpdateUserRoleArgs {
  @Field(returns => UpdateUserRoleInput)
  userRole!: UpdateUserRoleInput
}
