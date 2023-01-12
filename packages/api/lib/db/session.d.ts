import { User, UserRole } from '@prisma/client';
export declare enum SessionType {
    User = "user",
    Token = "token"
}
export interface TokenSession {
    type: SessionType.Token;
    id: string;
    name: string;
    token: string;
    roles: UserRole[];
}
export interface UserSession {
    type: SessionType.User;
    id: string;
    user: User;
    roles: UserRole[];
    createdAt: Date;
    expiresAt: Date;
    token: string;
}
export declare type Session = TokenSession | UserSession;
//# sourceMappingURL=session.d.ts.map