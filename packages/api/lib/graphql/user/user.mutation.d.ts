import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare type CreateUserInput = Prisma.UserUncheckedCreateInput & Partial<{
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutUserInput[];
    address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null;
}>;
export declare const createUser: ({ properties, address, password, ...input }: CreateUserInput, hashCostFactor: Context['hashCostFactor'], user: PrismaClient['user']) => Promise<{
    properties: import(".prisma/client").MetadataProperty[];
    modifiedAt: Date;
    id: string;
    createdAt: Date;
    email: string;
    emailVerifiedAt: Date | null;
    name: string;
    firstName: string | null;
    preferredName: string | null;
    password: string;
    active: boolean;
    lastLogin: Date | null;
    roleIDs: string[];
    userImageID: string | null;
    address: import(".prisma/client").UserAddress | null;
    oauth2Accounts: import(".prisma/client").UserOAuth2Account[];
    paymentProviderCustomers: import(".prisma/client").PaymentProviderCustomer[];
}>;
//# sourceMappingURL=user.mutation.d.ts.map