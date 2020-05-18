export interface CreateUserArgs {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly roleIDs: string[]
}

export interface GetUserForCredentialsArgs {
  readonly email: string
  readonly password: string
}

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly roleIDs: string[]
}

export type OptionalUser = User | null

export interface DBUserAdapter {
  createUser(args: CreateUserArgs): Promise<OptionalUser>
  getUser(email: string): Promise<OptionalUser>
  getUsersByID(ids: string[]): Promise<OptionalUser[]>
  getUserByID(id: string): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>
}
