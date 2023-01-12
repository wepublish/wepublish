import { Context } from '../../context';
import { Prisma, PrismaClient } from '@prisma/client';
export declare const deleteUserRoleById: (id: string, authenticate: Context['authenticate'], userRole: PrismaClient['userRole']) => Promise<import(".prisma/client").UserRole>;
export declare const createUserRole: (input: Omit<Prisma.UserRoleUncheckedCreateInput, 'modifiedAt' | 'systemRole'>, authenticate: Context['authenticate'], userRole: PrismaClient['userRole']) => Prisma.Prisma__UserRoleClient<import(".prisma/client").UserRole>;
export declare const updateUserRole: (id: string, input: Omit<Prisma.UserRoleUncheckedUpdateInput, 'modifiedAt' | 'systemRole'>, authenticate: Context['authenticate'], userRole: PrismaClient['userRole']) => Promise<import(".prisma/client").UserRole>;
//# sourceMappingURL=user-role.private-mutation.d.ts.map