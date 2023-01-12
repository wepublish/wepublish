import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const revokeSessionById: (id: string, authenticateUser: Context['authenticateUser'], session: PrismaClient['session']) => import(".prisma/client").PrismaPromise<import(".prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=session.private-mutation.d.ts.map