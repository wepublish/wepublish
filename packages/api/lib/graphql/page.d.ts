import { GraphQLObjectType, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { PublicPage, PageRevision, Page } from '../db/page';
export declare const GraphQLPageFilter: GraphQLInputObjectType;
export declare const GraphQLPublishedPageFilter: GraphQLInputObjectType;
export declare const GraphQLPageSort: GraphQLEnumType;
export declare const GraphQLPublishedPageSort: GraphQLEnumType;
export declare const GraphQLPageInput: GraphQLInputObjectType;
export declare const GraphQLPageRevision: GraphQLObjectType<PageRevision, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPage: GraphQLObjectType<Page, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPageConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPage: GraphQLObjectType<PublicPage, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPageConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
//# sourceMappingURL=page.d.ts.map