import { PaymentProviderCustomer, Prisma, User, UserAddress, UserOAuth2Account, MetadataProperty } from '@prisma/client';
export declare const hashPassword: (password: string, bcryptHashCostFactor?: number) => Promise<string>;
export declare enum UserSort {
    CreatedAt = "createdAt",
    ModifiedAt = "modifiedAt",
    Name = "name",
    FirstName = "firstName"
}
export interface UserFilter {
    readonly name?: string;
    readonly text?: string;
}
export declare const unselectPassword: Record<keyof Omit<Prisma.UserSelect, '_count' | 'Comment' | 'Session' | 'Subscription' | 'Invoice' | 'CommentRating' | 'PollVote' | 'userImage'>, boolean>;
export declare type UserWithRelations = User & {
    address: UserAddress | null;
    properties: MetadataProperty[];
    oauth2Accounts: UserOAuth2Account[];
    paymentProviderCustomers: PaymentProviderCustomer[];
};
//# sourceMappingURL=user.d.ts.map