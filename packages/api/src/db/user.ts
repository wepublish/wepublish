import bcrypt from 'bcrypt'
import {DefaultBcryptHashCostFactor} from './common'
import {Prisma} from '@prisma/client'

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
}

export const unselectPassword: Record<
  keyof Omit<Prisma.UserSelect, '_count' | 'Comment' | 'Session' | 'Subscription' | 'Invoice'>,
  boolean
> = {
  address: true,
  oauth2Accounts: true,
  properties: true,
  paymentProviderCustomers: true,
  id: true,
  createdAt: true,
  modifiedAt: true,
  email: true,
  emailVerifiedAt: true,
  name: true,
  firstName: true,
  preferredName: true,
  password: false,
  active: true,
  lastLogin: true,
  roleIDs: true
}
