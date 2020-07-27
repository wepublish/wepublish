import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export interface UserInput {
  readonly name: string
  readonly email: string
  readonly roleIDs: string[]
}

export interface CreateUserArgs {
  readonly input: UserInput
  readonly password: string
}

export interface UpdateUserArgs {
  readonly id: string
  readonly input: UserInput
}

export interface DeleteUserArgs {
  readonly id: string
}

export interface ResetUserPasswordArgs {
  readonly id: string
  readonly password: string
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
  updateUser(args: UpdateUserArgs): Promise<OptionalUser>
  deleteUser(args: DeleteUserArgs): Promise<string | null>

  resetUserPassword(args: ResetUserPasswordArgs): Promise<OptionalUser>

  getUser(email: string): Promise<OptionalUser>
  getUsersByID(ids: string[]): Promise<OptionalUser[]>
  getUserByID(id: string): Promise<OptionalUser>
  getUserForCredentials(args: GetUserForCredentialsArgs): Promise<OptionalUser>

  getUsers(args: GetUsersArgs): Promise<ConnectionResult<User>>
}
