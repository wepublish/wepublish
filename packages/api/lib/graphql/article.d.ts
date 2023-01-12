import { GraphQLObjectType, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { PublicArticle, ArticleRevision, Article, PeerArticle } from '../db/article';
export declare const GraphQLArticleFilter: GraphQLInputObjectType;
export declare const GraphQLPublicArticleFilter: GraphQLInputObjectType;
export declare const GraphQLArticleSort: GraphQLEnumType;
export declare const GraphQLPublicArticleSort: GraphQLEnumType;
export declare const GraphQLArticleInput: GraphQLInputObjectType;
export declare const GraphQLArticleRevision: GraphQLObjectType<ArticleRevision, Context, {
    [key: string]: any;
}>;
export declare const GraphQLArticle: GraphQLObjectType<Article, Context, {
    [key: string]: any;
}>;
export declare const GraphQLArticleConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPeerArticle: GraphQLObjectType<PeerArticle, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPeerArticleConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPublicArticle: GraphQLObjectType<PublicArticle, Context>;
export declare const GraphQLPublicArticleConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
//# sourceMappingURL=article.d.ts.map