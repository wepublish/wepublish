import { Payment } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../context';
export declare const GraphQLPaymentState: GraphQLEnumType;
export declare const GraphQLPublicPayment: GraphQLObjectType<Payment, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPayment: GraphQLObjectType<Payment, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPaymentFilter: GraphQLInputObjectType;
export declare const GraphQLPaymentSort: GraphQLEnumType;
export declare const GraphQLPaymentConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPaymentFromInvoiceInput: GraphQLInputObjectType;
//# sourceMappingURL=payment.d.ts.map