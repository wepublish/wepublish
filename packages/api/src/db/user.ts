export interface CreateUserArgs {
  readonly email: string
  readonly password: string
}

export interface GetUserForCredentialsArgs {
  readonly email: string
  readonly password: string
}

export interface User {
  readonly id: string
  readonly email: string
}

export type OptionalUser = User | null

export interface DBUserAdapter {
  createUser(args: CreateUserArgs): Promise<User>
  getUsersByID(ids: string[]): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>
}
