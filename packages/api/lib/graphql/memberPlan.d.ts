import { MemberPlan } from '../db/memberPlan';
import { Context } from '../context';
import { GraphQLObjectType, GraphQLInputObjectType, GraphQLEnumType } from 'graphql';
import { AvailablePaymentMethod } from '@prisma/client';
export declare const GraphQLPaymentPeriodicity: GraphQLEnumType;
export declare const GraphQLAvailablePaymentMethod: GraphQLObjectType<AvailablePaymentMethod, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicAvailablePaymentMethod: GraphQLObjectType<AvailablePaymentMethod, Context, {
    [key: string]: any;
}>;
export declare const GraphQLMemberPlan: GraphQLObjectType<MemberPlan, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicMemberPlan: GraphQLObjectType<MemberPlan, Context, {
    [key: string]: any;
}>;
export declare const GraphQLMemberPlanFilter: GraphQLInputObjectType;
export declare const GraphQLMemberPlanSort: GraphQLEnumType;
export declare const GraphQLMemberPlanConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicMemberPlanConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLAvailablePaymentMethodInput: GraphQLInputObjectType;
export declare const GraphQLMemberPlanInput: GraphQLInputObjectType;
//# sourceMappingURL=memberPlan.d.ts.map