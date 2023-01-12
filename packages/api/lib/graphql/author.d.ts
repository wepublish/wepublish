import { GraphQLObjectType, GraphQLInputObjectType, GraphQLEnumType } from 'graphql';
import { Author } from '../db/author';
import { Context } from '../context';
export declare const GraphQLAuthorLink: GraphQLObjectType<Author, Context, {
    [key: string]: any;
}>;
export declare const GraphQLAuthor: GraphQLObjectType<Author, Context, {
    [key: string]: any;
}>;
export declare const GraphQLAuthorFilter: GraphQLInputObjectType;
export declare const GraphQLAuthorSort: GraphQLEnumType;
export declare const GraphQLAuthorConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLAuthorLinkInput: GraphQLInputObjectType;
export declare const GraphQLAuthorInput: GraphQLInputObjectType;
//# sourceMappingURL=author.d.ts.map