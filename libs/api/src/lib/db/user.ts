import {
  PaymentProviderCustomer,
  User,
  UserAddress,
  UserOAuth2Account,
  MetadataProperty
} from '@prisma/client'
import bcrypt from 'bcrypt'
import {DefaultBcryptHashCostFactor} from './common'

export const hashPassword = async (
  password: string,
  bcryptHashCostFactor: number = DefaultBcryptHashCostFactor
) => bcrypt.hash(password, bcryptHashCostFactor)

export enum UserSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name',
  FirstName = 'firstName'
}

export interface UserFilter {
  readonly name?: string
  readonly text?: string
  readonly userRole?: string[]
}

export type UserWithRelations = User & {
  address: UserAddress | null
  properties: MetadataProperty[]
  oauth2Accounts: UserOAuth2Account[]
  paymentProviderCustomers: PaymentProviderCustomer[]
}
