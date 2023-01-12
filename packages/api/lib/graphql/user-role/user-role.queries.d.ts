import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { UserRoleFilter, UserRoleSort } from '../../db/userRole';
import { SortOrder } from '../queries/sort';
export declare const createUserRoleOrder: (field: UserRoleSort, sortOrder: SortOrder) => Prisma.UserRoleFindManyArgs['orderBy'];
export declare const createUserRoleFilter: (filter: Partial<UserRoleFilter>) => Prisma.UserRoleWhereInput;
export declare const getUserRoles: (filter: Partial<UserRoleFilter>, sortedField: UserRoleSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, userRole: PrismaClient['userRole']) => Promise<ConnectionResult<UserRole>>;
//# sourceMappingURL=user-role.queries.d.ts.map