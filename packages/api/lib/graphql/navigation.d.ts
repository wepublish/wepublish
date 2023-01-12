import { GraphQLInterfaceType, GraphQLObjectType, GraphQLUnionType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { ArticleNavigationLink, PageNavigationLink, ExternalNavigationLink } from '../db/navigation';
export declare const GraphQLBaseNavigationLink: GraphQLInterfaceType;
export declare const GraphQLPageNavigationLink: GraphQLObjectType<PageNavigationLink, Context, {
    [key: string]: any;
}>;
export declare const GraphQLArticleNavigationLink: GraphQLObjectType<ArticleNavigationLink, Context, {
    [key: string]: any;
}>;
export declare const GraphQLExternalNavigationLink: GraphQLObjectType<ExternalNavigationLink, Context, {
    [key: string]: any;
}>;
export declare const GraphQLNavigationLink: GraphQLUnionType;
export declare const GraphQLNavigation: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPageNavigationLink: GraphQLObjectType<PageNavigationLink, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicArticleNavigationLink: GraphQLObjectType<ArticleNavigationLink, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicNavigationLink: GraphQLUnionType;
export declare const GraphQLPublicNavigation: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLArticleNavigationLinkInput: GraphQLInputObjectType;
export declare const GraphQLPageNavigationLinkInput: GraphQLInputObjectType;
export declare const GraphQLExternalNavigationLinkInput: GraphQLInputObjectType;
export declare const GraphQLNavigationLinkInput: GraphQLInputObjectType;
export declare const GraphQLNavigationInput: GraphQLInputObjectType;
//# sourceMappingURL=navigation.d.ts.map