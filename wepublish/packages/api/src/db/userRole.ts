import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export interface UserRoleInput {
  readonly name: string
  readonly description: string
  readonly permissionIDs: string[]
}

export interface CreateUserRoleArgs {
  readonly input: UserRoleInput
}
export interface UpdateUserRoleArgs {
  readonly id: string
  readonly input: UserRoleInput
}

export interface DeleteUserRoleArgs {
  readonly id: string
}

export enum UserRoleSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface UserRoleFilter {
  readonly name?: string
}

export interface UserRole {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly systemRole: boolean
  readonly permissionIDs: string[]
}

export type OptionalUserRole = UserRole | null

export interface GetUserRolesArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: UserRoleFilter
  readonly sort: UserRoleSort
  readonly order: SortOrder
}

export interface DBUserRoleAdapter {
  createUserRole(args: CreateUserRoleArgs): Promise<OptionalUserRole>
  updateUserRole(args: UpdateUserRoleArgs): Promise<OptionalUserRole>
  deleteUserRole(args: DeleteUserRoleArgs): Promise<string | null>
  getUserRole(name: string): Promise<OptionalUserRole>
  getUserRoleByID(id: string): Promise<OptionalUserRole>
  getUserRolesByID(ids: readonly string[]): Promise<OptionalUserRole[]>

  getUserRoles(args: GetUserRolesArgs): Promise<ConnectionResult<UserRole>>
}
