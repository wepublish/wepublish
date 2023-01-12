import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../context';
import { User } from '@prisma/client';
export declare const GraphQLUserAddress: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPaymentProviderCustomer: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLOAuth2Account: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLUser: GraphQLObjectType<User, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicUser: GraphQLObjectType<User, Context, {
    [key: string]: any;
}>;
export declare const GraphQLUserFilter: GraphQLInputObjectType;
export declare const GraphQLUserSort: GraphQLEnumType;
export declare const GraphQLUserConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLUserAddressInput: GraphQLInputObjectType;
export declare const GraphQLUserInput: GraphQLInputObjectType;
export declare const GraphQLPublicUserInput: GraphQLInputObjectType;
export declare const GraphQLPaymentProviderCustomerInput: GraphQLInputObjectType;
export declare const GraphQLUserSession: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLMemberRegistration: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLMemberRegistrationAndPayment: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
//# sourceMappingURL=user.d.ts.map