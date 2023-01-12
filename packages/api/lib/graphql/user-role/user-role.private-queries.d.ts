import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { UserRoleFilter, UserRoleSort } from '../../db/userRole';
export declare const getUserRoleById: (id: string, authenticate: Context['authenticate'], userRoleLoader: Context['loaders']['userRolesByID']) => Promise<import(".prisma/client").UserRole | null>;
export declare const getAdminUserRoles: (filter: Partial<UserRoleFilter>, sortedField: UserRoleSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], userRole: PrismaClient['userRole']) => Promise<import("../..").ConnectionResult<import(".prisma/client").UserRole>>;
//# sourceMappingURL=user-role.private-queries.d.ts.map