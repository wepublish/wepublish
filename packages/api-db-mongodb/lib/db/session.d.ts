import { OptionalUserSession, OptionalSession, User, UserSession, DBSessionAdapter } from '@wepublish/api';
import { Db } from 'mongodb';
import { MongoDBUserAdapter } from './user';
import { MongoDBUserRoleAdapter } from './userRole';
export declare class MongoDBSessionAdapter implements DBSessionAdapter {
    private sessions;
    private tokens;
    private user;
    private userRole;
    private sessionTTL;
    constructor(db: Db, user: MongoDBUserAdapter, userRole: MongoDBUserRoleAdapter, sessionTTL: number);
    createUserSession(user: User): Promise<OptionalUserSession>;
    deleteUserSessionByToken(token: string): Promise<boolean>;
    getSessionByToken(token: string): Promise<OptionalSession>;
    extendUserSessionByToken(token: string): Promise<OptionalUserSession>;
    deleteUserSessionByID(user: User, id: string): Promise<boolean>;
    getUserSessions(user: User): Promise<UserSession[]>;
    getSessionByID(user: User, id: string): Promise<OptionalSession>;
}
//# sourceMappingURL=session.d.ts.map