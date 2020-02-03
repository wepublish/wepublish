import {QueryOpts} from './adapter'

export interface CreateUserArgs {
  readonly id: string
  readonly email: string
  readonly password: string
}

export interface GetUserForCredentialsArgs {
  readonly email: string
  readonly password: string
}

export interface User {
  readonly id?: string
  readonly email?: string
}

export type OptionalUser = User | null

export interface DBUserAdapter {
  createUser(args: CreateUserArgs, opts: QueryOpts): Promise<User>
  getUserForCredentials(args: GetUserForCredentialsArgs, opts: QueryOpts): Promise<OptionalUser>
}
