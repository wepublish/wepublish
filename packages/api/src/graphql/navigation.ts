import {
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLID,
  GraphQLInputObjectType
} from 'graphql'

import {Context} from '../context'

import {
  ArticleNavigationLink,
  NavigationLinkType,
  PageNavigationLink,
  ExternalNavigationLink
} from '../db/navigation'
import {GraphQLArticle, GraphQLPublicArticle} from './article'
import {GraphQLPage, GraphQLPublicPage} from './page'
import {createProxyingResolver, createProxyingIsTypeOf} from '../utility'

export const GraphQLBaseNavigationLink = new GraphQLInterfaceType({
  name: 'BaseNavigationLink',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    page: {
      type: GraphQLPage,
      resolve: createProxyingResolver(({pageID}, _args, {loaders}) => {
        return loaders.pages.load(pageID)
      })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === NavigationLinkType.Page
  })
})

export const GraphQLArticleNavigationLink = new GraphQLObjectType<ArticleNavigationLink, Context>({
  name: 'ArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLArticle,
      resolve: createProxyingResolver(({articleID}, _args, {loaders}) => {
        return loaders.articles.load(articleID)
      })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === NavigationLinkType.Article
  })
})

export const GraphQLExternalNavigationLink = new GraphQLObjectType<ExternalNavigationLink, Context>(
  {
    name: 'ExternalNavigationLink',
    interfaces: [GraphQLBaseNavigationLink],
    fields: {
      label: {type: GraphQLNonNull(GraphQLString)},
      url: {type: GraphQLNonNull(GraphQLString)}
    },
    isTypeOf: createProxyingIsTypeOf(value => {
      return value.type === NavigationLinkType.External
    })
  }
)

export const GraphQLNavigationLink = new GraphQLUnionType({
  name: 'NavigationLink',
  types: [GraphQLPageNavigationLink, GraphQLArticleNavigationLink, GraphQLExternalNavigationLink]
})

export const GraphQLNavigation = new GraphQLObjectType({
  name: 'Navigation',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    key: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigationLink)))}
  }
})

export const GraphQLPublicPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    page: {
      type: GraphQLPublicPage,
      resolve: createProxyingResolver(({pageID}, _args, {loaders}) => {
        return loaders.publicPagesByID.load(pageID)
      })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === NavigationLinkType.Page
  })
})

export const GraphQLPublicArticleNavigationLink = new GraphQLObjectType<
  ArticleNavigationLink,
  Context
>({
  name: 'ArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLPublicArticle,
      resolve: createProxyingResolver(({articleID}, _args, {loaders}) => {
        return loaders.publicArticles.load(articleID)
      })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === NavigationLinkType.Article
  })
})

export const GraphQLPublicNavigationLink = new GraphQLUnionType({
  name: 'NavigationLink',
  types: [
    GraphQLPublicPageNavigationLink,
    GraphQLPublicArticleNavigationLink,
    GraphQLExternalNavigationLink
  ]
})

export const GraphQLPublicNavigation = new GraphQLObjectType({
  name: 'Navigation',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    key: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicNavigationLink)))}
  }
})

export const GraphQLArticleNavigationLinkInput = new GraphQLInputObjectType({
  name: 'ArticleNavigationLinkInput',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    articleID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLPageNavigationLinkInput = new GraphQLInputObjectType({
  name: 'PageNavigationLinkInput',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    pageID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLExternalNavigationLinkInput = new GraphQLInputObjectType({
  name: 'ExternalNavigationLinkInput',
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLNavigationLinkInput = new GraphQLInputObjectType({
  name: 'NavigationLinkInput',
  fields: {
    [NavigationLinkType.Page]: {type: GraphQLPageNavigationLinkInput},
    [NavigationLinkType.Article]: {type: GraphQLArticleNavigationLinkInput},
    [NavigationLinkType.External]: {type: GraphQLExternalNavigationLinkInput}
  }
})

export const GraphQLNavigationInput = new GraphQLInputObjectType({
  name: 'NavigationInput',
  fields: {
    key: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigationLinkInput)))}
  }
})
