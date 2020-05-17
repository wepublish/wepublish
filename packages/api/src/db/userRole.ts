export interface CreateUserRoleArgs {
  readonly name: string
  readonly email: string
  readonly description: string
  readonly permissions: string[]
}

export interface UserRole {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly systemRole: boolean
  readonly permissions: string[]
}

export type OptionalUserRole = UserRole | null

export interface DBUserRoleAdapter {
  createUserRole(args: CreateUserRoleArgs): Promise<OptionalUserRole>
  getUserRole(name: string): Promise<OptionalUserRole>
  getUserRoleByID(id: string): Promise<OptionalUserRole>
  getUserRolesByID(ids: readonly string[]): Promise<OptionalUserRole[]>
}
