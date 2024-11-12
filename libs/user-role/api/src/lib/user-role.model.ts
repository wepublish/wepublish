import {ObjectType, Field, InputType, ArgsType, ID, registerEnumType} from '@nestjs/graphql'
import {PermissionObject} from '@wepublish/permissions/api'
import {PaginatedArgsType, PaginatedType} from '@wepublish/utils/api'

@ObjectType()
export class UserRole {
  @Field(() => String)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String, {nullable: true})
  description!: string | null

  @Field(() => Boolean)
  systemRole!: boolean

  @Field(() => [String])
  permissionIDs!: string[]

  @Field(() => [PermissionObject], {nullable: true})
  permissions?: PermissionObject[]
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
export class GetUserRolesArgs extends PaginatedArgsType {
  @Field({nullable: true})
  filter?: UserRoleFilter
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