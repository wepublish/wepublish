import { Tag } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../../context';
export declare const GraphQLTagType: GraphQLEnumType;
export declare const GraphQLTag: GraphQLObjectType<Tag, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTagConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLTagFilter: GraphQLInputObjectType;
export declare const GraphQLTagSort: GraphQLEnumType;
//# sourceMappingURL=tag.d.ts.map