"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLNavigationInput = exports.GraphQLNavigationLinkInput = exports.GraphQLExternalNavigationLinkInput = exports.GraphQLPageNavigationLinkInput = exports.GraphQLArticleNavigationLinkInput = exports.GraphQLPublicNavigation = exports.GraphQLPublicNavigationLink = exports.GraphQLPublicArticleNavigationLink = exports.GraphQLPublicPageNavigationLink = exports.GraphQLNavigation = exports.GraphQLNavigationLink = exports.GraphQLExternalNavigationLink = exports.GraphQLArticleNavigationLink = exports.GraphQLPageNavigationLink = exports.GraphQLBaseNavigationLink = void 0;
const graphql_1 = require("graphql");
const navigation_1 = require("../db/navigation");
const article_1 = require("./article");
const page_1 = require("./page");
const utility_1 = require("../utility");
exports.GraphQLBaseNavigationLink = new graphql_1.GraphQLInterfaceType({
    name: 'BaseNavigationLink',
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLPageNavigationLink = new graphql_1.GraphQLObjectType({
    name: 'PageNavigationLink',
    interfaces: [exports.GraphQLBaseNavigationLink],
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        page: {
            type: page_1.GraphQLPage,
            resolve: (0, utility_1.createProxyingResolver)(({ pageID }, _args, { loaders }) => {
                return loaders.pages.load(pageID);
            })
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === navigation_1.NavigationLinkType.Page;
    })
});
exports.GraphQLArticleNavigationLink = new graphql_1.GraphQLObjectType({
    name: 'ArticleNavigationLink',
    interfaces: [exports.GraphQLBaseNavigationLink],
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        article: {
            type: article_1.GraphQLArticle,
            resolve: (0, utility_1.createProxyingResolver)(({ articleID }, _args, { loaders }) => {
                return loaders.articles.load(articleID);
            })
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === navigation_1.NavigationLinkType.Article;
    })
});
exports.GraphQLExternalNavigationLink = new graphql_1.GraphQLObjectType({
    name: 'ExternalNavigationLink',
    interfaces: [exports.GraphQLBaseNavigationLink],
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === navigation_1.NavigationLinkType.External;
    })
});
exports.GraphQLNavigationLink = new graphql_1.GraphQLUnionType({
    name: 'NavigationLink',
    types: [exports.GraphQLPageNavigationLink, exports.GraphQLArticleNavigationLink, exports.GraphQLExternalNavigationLink]
});
exports.GraphQLNavigation = new graphql_1.GraphQLObjectType({
    name: 'Navigation',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        links: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLNavigationLink))) }
    }
});
exports.GraphQLPublicPageNavigationLink = new graphql_1.GraphQLObjectType({
    name: 'PageNavigationLink',
    interfaces: [exports.GraphQLBaseNavigationLink],
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        page: {
            type: page_1.GraphQLPublicPage,
            resolve: (0, utility_1.createProxyingResolver)(({ pageID }, _args, { loaders }) => {
                return loaders.publicPagesByID.load(pageID);
            })
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === navigation_1.NavigationLinkType.Page;
    })
});
exports.GraphQLPublicArticleNavigationLink = new graphql_1.GraphQLObjectType({
    name: 'ArticleNavigationLink',
    interfaces: [exports.GraphQLBaseNavigationLink],
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        article: {
            type: article_1.GraphQLPublicArticle,
            resolve: (0, utility_1.createProxyingResolver)(({ articleID }, _args, { loaders }) => {
                return loaders.publicArticles.load(articleID);
            })
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === navigation_1.NavigationLinkType.Article;
    })
});
exports.GraphQLPublicNavigationLink = new graphql_1.GraphQLUnionType({
    name: 'NavigationLink',
    types: [
        exports.GraphQLPublicPageNavigationLink,
        exports.GraphQLPublicArticleNavigationLink,
        exports.GraphQLExternalNavigationLink
    ]
});
exports.GraphQLPublicNavigation = new graphql_1.GraphQLObjectType({
    name: 'Navigation',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        links: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicNavigationLink))) }
    }
});
exports.GraphQLArticleNavigationLinkInput = new graphql_1.GraphQLInputObjectType({
    name: 'ArticleNavigationLinkInput',
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        articleID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
    }
});
exports.GraphQLPageNavigationLinkInput = new graphql_1.GraphQLInputObjectType({
    name: 'PageNavigationLinkInput',
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        pageID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
    }
});
exports.GraphQLExternalNavigationLinkInput = new graphql_1.GraphQLInputObjectType({
    name: 'ExternalNavigationLinkInput',
    fields: {
        label: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLNavigationLinkInput = new graphql_1.GraphQLInputObjectType({
    name: 'NavigationLinkInput',
    fields: {
        [navigation_1.NavigationLinkType.Page]: { type: exports.GraphQLPageNavigationLinkInput },
        [navigation_1.NavigationLinkType.Article]: { type: exports.GraphQLArticleNavigationLinkInput },
        [navigation_1.NavigationLinkType.External]: { type: exports.GraphQLExternalNavigationLinkInput }
    }
});
exports.GraphQLNavigationInput = new graphql_1.GraphQLInputObjectType({
    name: 'NavigationInput',
    fields: {
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        links: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLNavigationLinkInput))) }
    }
});
//# sourceMappingURL=navigation.js.map