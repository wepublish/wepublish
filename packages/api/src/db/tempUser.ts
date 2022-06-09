import {PaymentProviderCustomer, UpdatePaymentProviderCustomerArgs, UserAddress} from './user'

export interface CreateTempUserArgs {
  readonly input: TempUserInput
}

export interface UpdateTempUserArgs {
  readonly id: string
  readonly input: TempUserInput
}

export interface DeleteTempUserArgs {
  readonly id: string
}

export interface TempUserInput {
  readonly name: string
  readonly firstName?: string
  readonly preferredName?: string
  readonly email: string

  readonly address?: UserAddress
}

export interface TempUser {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly name: string
  readonly firstName?: string
  readonly preferredName?: string
  readonly email: string
  readonly address?: UserAddress
  readonly paymentProviderCustomers: PaymentProviderCustomer[]
}

export type OptionalTempUser = TempUser | null

export type UserId = string
export type UserIdWithTempPrefix = string
export type GenericUserId = UserId | UserIdWithTempPrefix

export interface DBTempUserAdapter {
  createTempUser(args: CreateTempUserArgs): Promise<OptionalTempUser>
  updateTempUser(args: UpdateTempUserArgs): Promise<OptionalTempUser>
  deleteTempUser(args: DeleteTempUserArgs): Promise<string | null>

  getTempUserByID(id: UserId): Promise<OptionalTempUser>
  updatePaymentProviderCustomers({
    userID,
    paymentProviderCustomers
  }: UpdatePaymentProviderCustomerArgs): Promise<OptionalTempUser>
}
