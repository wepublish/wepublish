import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
import { SessionType } from '../../db/session';
export declare const getSessionsForUser: (authenticateUser: Context['authenticateUser'], session: PrismaClient['session'], userRole: PrismaClient['userRole']) => Promise<{
    type: SessionType;
    user: import(".prisma/client").User;
    roles: import(".prisma/client").UserRole[];
    id: string;
    createdAt: Date;
    expiresAt: Date;
    token: string;
    userID: string;
}[]>;
//# sourceMappingURL=session.private-queries.d.ts.map