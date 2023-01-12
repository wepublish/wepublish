import { InvoiceItem } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../context';
import { InvoiceWithItems } from '../db/invoice';
export declare const GraphQLInvoiceItem: GraphQLObjectType<InvoiceItem, Context, {
    [key: string]: any;
}>;
export declare const GraphQLInvoice: GraphQLObjectType<InvoiceWithItems, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicInvoice: GraphQLObjectType<InvoiceWithItems, Context, {
    [key: string]: any;
}>;
export declare const GraphQLinvoiceFilter: GraphQLInputObjectType;
export declare const GraphQLInvoiceSort: GraphQLEnumType;
export declare const GraphQLInvoiceConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLInvoiceItemInput: GraphQLInputObjectType;
export declare const GraphQLInvoiceInput: GraphQLInputObjectType;
//# sourceMappingURL=invoice.d.ts.map