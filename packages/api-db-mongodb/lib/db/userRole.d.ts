import { DBUserRoleAdapter, CreateUserRoleArgs, OptionalUserRole, UserRole, UpdateUserRoleArgs, DeleteUserRoleArgs, GetUserRolesArgs, ConnectionResult } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBUserRoleAdapter implements DBUserRoleAdapter {
    private userRoles;
    private locale;
    constructor(db: Db, locale: string);
    createUserRole({ input }: CreateUserRoleArgs): Promise<OptionalUserRole>;
    updateUserRole({ id, input }: UpdateUserRoleArgs): Promise<OptionalUserRole>;
    deleteUserRole({ id }: DeleteUserRoleArgs): Promise<string | null>;
    getUserRole(name: string): Promise<OptionalUserRole>;
    getUserRoleByID(id: string): Promise<OptionalUserRole>;
    getUserRolesByID(ids: string[]): Promise<OptionalUserRole[]>;
    getNonOptionalUserRolesByID(ids: string[]): Promise<UserRole[]>;
    getUserRoles({ filter, sort, order, cursor, limit }: GetUserRolesArgs): Promise<ConnectionResult<UserRole>>;
}
//# sourceMappingURL=userRole.d.ts.map