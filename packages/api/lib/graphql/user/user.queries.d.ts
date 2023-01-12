import { Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { UserFilter, UserSort, UserWithRelations } from '../../db/user';
import { SortOrder } from '../queries/sort';
export declare const createUserOrder: (field: UserSort, sortOrder: SortOrder) => Prisma.UserFindManyArgs['orderBy'];
export declare const createUserFilter: (filter: Partial<UserFilter>) => Prisma.UserWhereInput;
export declare const getUsers: (filter: Partial<UserFilter>, sortedField: UserSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, user: PrismaClient['user']) => Promise<ConnectionResult<UserWithRelations>>;
export declare const getUserForCredentials: (email: string, password: string, userClient: PrismaClient['user']) => Promise<(import(".prisma/client").User & {
    address: import(".prisma/client").UserAddress | null;
    properties: import(".prisma/client").MetadataProperty[];
    oauth2Accounts: import(".prisma/client").UserOAuth2Account[];
    paymentProviderCustomers: import(".prisma/client").PaymentProviderCustomer[];
}) | null>;
//# sourceMappingURL=user.queries.d.ts.map