import { PrismaClient, User } from '@prisma/client';
import { Context } from '../../context';
import { SessionType } from '../../db/session';
export declare function generateToken(): string;
export declare const revokeSessionByToken: (authenticateUser: Context['authenticateUser'], sessionClient: PrismaClient['session']) => Promise<void> | import(".prisma/client").Prisma.Prisma__SessionClient<import(".prisma/client").Session>;
export declare const createUserSession: (user: User, sessionTTL: number, sessionClient: PrismaClient['session'], userRoleClient: PrismaClient['userRole']) => Promise<{
    type: SessionType;
    id: string;
    user: User;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    roles: import(".prisma/client").UserRole[];
}>;
export declare const createSession: (email: string, password: string, sessionTTL: Context['sessionTTL'], sessionClient: PrismaClient['session'], userClient: PrismaClient['user'], userRoleClient: PrismaClient['userRole']) => Promise<{
    type: SessionType;
    id: string;
    user: User;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    roles: import(".prisma/client").UserRole[];
}>;
export declare const createJWTSession: (jwt: string, sessionTTL: Context['sessionTTL'], verifyJWT: Context['verifyJWT'], sessionClient: PrismaClient['session'], userClient: PrismaClient['user'], userRoleClient: PrismaClient['userRole']) => Promise<{
    type: SessionType;
    id: string;
    user: User;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    roles: import(".prisma/client").UserRole[];
}>;
export declare const createOAuth2Session: (name: string, code: string, redirectUri: string, sessionTTL: Context['sessionTTL'], oauth2Providers: Context['oauth2Providers'], sessionClient: PrismaClient['session'], userClient: PrismaClient['user'], userRoleClient: PrismaClient['userRole']) => Promise<{
    type: SessionType;
    id: string;
    user: User;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    roles: import(".prisma/client").UserRole[];
}>;
//# sourceMappingURL=session.mutation.d.ts.map