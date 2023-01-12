import { MailLog } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../context';
export declare const GraphQLMailLogState: GraphQLEnumType;
export declare const GraphQLMailLog: GraphQLObjectType<MailLog, Context, {
    [key: string]: any;
}>;
export declare const GraphQLMailLogFilter: GraphQLInputObjectType;
export declare const GraphQLMailLogSort: GraphQLEnumType;
export declare const GraphQLMailLogConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=mailLog.d.ts.map