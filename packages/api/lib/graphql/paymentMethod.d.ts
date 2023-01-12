import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { PaymentProvider } from '../payments/paymentProvider';
import { PaymentMethod } from '@prisma/client';
export declare const GraphQLPaymentProvider: GraphQLObjectType<PaymentProvider, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPaymentMethod: GraphQLObjectType<PaymentMethod, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPaymentMethod: GraphQLObjectType<PaymentMethod, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPaymentMethodInput: GraphQLInputObjectType;
//# sourceMappingURL=paymentMethod.d.ts.map