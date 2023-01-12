import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
import { UserFilter, UserSort } from '../../db/user';
export declare const getMe: (authenticate: Context['authenticate']) => import(".prisma/client").User | null;
export declare const getUserById: (id: string, authenticate: Context['authenticate'], user: PrismaClient['user']) => import(".prisma/client").Prisma.Prisma__UserClient<{
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
} | null>;
export declare const getAdminUsers: (filter: Partial<UserFilter>, sortedField: UserSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], user: PrismaClient['user']) => Promise<import("../..").ConnectionResult<import("../../db/user").UserWithRelations>>;
//# sourceMappingURL=user.private-queries.d.ts.map