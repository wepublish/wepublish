import { Subscription } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../context';
import { SubscriptionWithRelations, SubscribersPerMonth } from '../db/subscription';
export declare const GraphQLSubscription: GraphQLObjectType<Subscription, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicSubscription: GraphQLObjectType<SubscriptionWithRelations, Context, {
    [key: string]: any;
}>;
export declare const GraphQLSubscriptionFilter: GraphQLInputObjectType;
export declare const GraphQLSubscriptionSort: GraphQLEnumType;
export declare const GraphQLSubscriptionConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLSubscriptionDeactivationInput: GraphQLInputObjectType;
export declare const GraphQLSubscriptionInput: GraphQLInputObjectType;
export declare const GraphQLPublicSubscriptionInput: GraphQLInputObjectType;
export declare const GraphQLSubscribersPerMonth: GraphQLObjectType<SubscribersPerMonth, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=subscription.d.ts.map