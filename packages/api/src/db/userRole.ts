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
  readonly description?: string | null
  readonly systemRole: boolean
  readonly permissionIDs: string[]
}

export type OptionalUserRole = UserRole | null

export interface DBUserRoleAdapter {
  createUserRole(args: CreateUserRoleArgs): Promise<OptionalUserRole>
  updateUserRole(args: UpdateUserRoleArgs): Promise<OptionalUserRole>
  deleteUserRole(args: DeleteUserRoleArgs): Promise<string | null>

  getUserRole(name: string): Promise<OptionalUserRole>
}
