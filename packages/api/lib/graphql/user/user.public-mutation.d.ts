import { Prisma, PrismaClient, User } from '@prisma/client';
import { Context } from '../../context';
import { CreateImageInput } from '../image/image.private-mutation';
export declare const updatePaymentProviderCustomers: (paymentProviderCustomers: Prisma.UserUncheckedUpdateInput['paymentProviderCustomers'], authenticateUser: Context['authenticateUser'], userClient: PrismaClient['user']) => Promise<import(".prisma/client").PaymentProviderCustomer[]>;
/**
 * Uploads the user profile image and returns the image and updated user
 * @param uploadImageInput
 * @param authenticateUser
 * @param mediaAdapter
 * @param imageClient
 * @param userClient
 */
export declare function uploadPublicUserProfileImage(uploadImageInput: CreateImageInput, authenticateUser: Context['authenticateUser'], mediaAdapter: Context['mediaAdapter'], imageClient: PrismaClient['image'], userClient: PrismaClient['user']): Promise<null | User>;
declare type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
    address: Prisma.UserAddressUncheckedUpdateWithoutUserInput;
} & {
    uploadImageInput: CreateImageInput;
};
export declare const updatePublicUser: ({ address, name, email, firstName, preferredName, uploadImageInput }: UpdateUserInput, authenticateUser: Context['authenticateUser'], mediaAdapter: Context['mediaAdapter'], userClient: PrismaClient['user'], imageClient: PrismaClient['image']) => Promise<{
    properties: import(".prisma/client").MetadataProperty[];
    modifiedAt: Date;
    id: string;
    createdAt: Date;
    email: string;
    emailVerifiedAt: Date | null;
    name: string;
    firstName: string | null;
    preferredName: string | null;
    password: string;
    active: boolean;
    lastLogin: Date | null;
    roleIDs: string[];
    userImageID: string | null;
    address: import(".prisma/client").UserAddress | null;
    oauth2Accounts: import(".prisma/client").UserOAuth2Account[];
    paymentProviderCustomers: import(".prisma/client").PaymentProviderCustomer[];
}>;
export declare const updateUserPassword: (password: string, passwordRepeated: string, hashCostFactor: number, authenticateUser: Context['authenticateUser'], userClient: PrismaClient['user']) => Promise<{
    properties: import(".prisma/client").MetadataProperty[];
    modifiedAt: Date;
    id: string;
    createdAt: Date;
    email: string;
    emailVerifiedAt: Date | null;
    name: string;
    firstName: string | null;
    preferredName: string | null;
    password: string;
    active: boolean;
    lastLogin: Date | null;
    roleIDs: string[];
    userImageID: string | null;
    address: import(".prisma/client").UserAddress | null;
    oauth2Accounts: import(".prisma/client").UserOAuth2Account[];
    paymentProviderCustomers: import(".prisma/client").PaymentProviderCustomer[];
}>;
export {};
//# sourceMappingURL=user.public-mutation.d.ts.map