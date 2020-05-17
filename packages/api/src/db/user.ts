import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export interface CreateUserArgs {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly roles: string[]
}

export interface GetUserForCredentialsArgs {
  readonly email: string
  readonly password: string
}

export enum UserSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface UserFilter {
  readonly name?: string
}

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly roleIDs: string[]
}

export type OptionalUser = User | null

export interface GetUsersArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: UserFilter
  readonly sort: UserSort
  readonly order: SortOrder
}

export interface DBUserAdapter {
  createUser(args: CreateUserArgs): Promise<OptionalUser>
  getUser(email: string): Promise<OptionalUser>
  getUsersByID(ids: string[]): Promise<OptionalUser[]>
  getUserByID(id: string): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>

  getUsers(args: GetUsersArgs): Promise<ConnectionResult<User>>
}
