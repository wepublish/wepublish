import {
  PaymentProviderCustomer,
  User,
  UserAddress,
  MetadataProperty,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { DefaultBcryptHashCostFactor } from './common';
import { randomBytes } from 'crypto';

export const hashPassword = async (
  password: string,
  bcryptHashCostFactor: number = DefaultBcryptHashCostFactor
) => bcrypt.hash(password, bcryptHashCostFactor);

export const generateSecureRandomPassword = (length: number) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-';
  let password = '';
  const characterCount = characters.length;
  const maxValidValue = 256 - (256 % characterCount);

  while (password.length < length) {
    const randomValue = randomBytes(1)[0];
    if (randomValue < maxValidValue) {
      const index = randomValue % characterCount;
      password += characters.charAt(index);
    }
  }
  return password;
};

export enum UserSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name',
  FirstName = 'firstName',
}

export interface UserFilter {
  readonly name?: string;
  readonly text?: string;
  readonly userRole?: string[];
}

export type UserWithRelations = User & {
  address: UserAddress | null;
  properties: MetadataProperty[];
  paymentProviderCustomers: PaymentProviderCustomer[];
};
