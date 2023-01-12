import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { Token } from '@prisma/client';
export declare const GraphQLTokenInput: GraphQLInputObjectType;
export declare const GraphQLToken: GraphQLObjectType<Token, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCreatedToken: GraphQLObjectType<Token, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=token.d.ts.map