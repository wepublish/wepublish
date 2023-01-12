import { ConnectionResult, CreateUserArgs, DBUserAdapter, DeleteUserArgs, DeleteUserOAuth2AccountArgs, GetUserByOAuth2AccountArgs, GetUserForCredentialsArgs, GetUsersArgs, OptionalUser, ResetUserPasswordArgs, UpdatePaymentProviderCustomerArgs, UpdateUserArgs, User, UserOAuth2AccountArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBUserAdapter implements DBUserAdapter {
    private users;
    private bcryptHashCostFactor;
    private locale;
    constructor(db: Db, bcryptHashCostFactor: number, locale: string);
    createUser({ input, password }: CreateUserArgs): Promise<OptionalUser>;
    getUser(email: string): Promise<OptionalUser>;
    updateUser({ id, input }: UpdateUserArgs): Promise<OptionalUser>;
    deleteUser({ id }: DeleteUserArgs): Promise<string | null>;
    resetUserPassword({ id, password }: ResetUserPasswordArgs): Promise<OptionalUser>;
    getUsersByID(ids: string[]): Promise<OptionalUser[]>;
    getUserForCredentials({ email, password }: GetUserForCredentialsArgs): Promise<OptionalUser>;
    getUserByID(id: string): Promise<OptionalUser>;
    getUserByOAuth2Account({ provider, providerAccountId }: GetUserByOAuth2AccountArgs): Promise<OptionalUser>;
    getUsers({ filter, sort, order, cursor, limit }: GetUsersArgs): Promise<ConnectionResult<User>>;
    updatePaymentProviderCustomers({ userID, paymentProviderCustomers }: UpdatePaymentProviderCustomerArgs): Promise<OptionalUser>;
    addOAuth2Account({ userID, oauth2Account }: UserOAuth2AccountArgs): Promise<OptionalUser>;
    deleteOAuth2Account({ userID, providerAccountId, provider }: DeleteUserOAuth2AccountArgs): Promise<OptionalUser>;
}
//# sourceMappingURL=user.d.ts.map