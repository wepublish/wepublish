import {
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLID
} from 'graphql'

import {Context} from '../context'

import {ArticleNavigationLink, NavigationLinkType, PageNavigationLink} from '../db/navigation'
import {GraphQLArticle} from './article'
import {GraphQLPage} from './page'

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
      resolve({pageID}, _args, {loaders}) {
        return loaders.pages.load(pageID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Page
  }
})

export const GraphQLArticleNavigationLink = new GraphQLObjectType<ArticleNavigationLink, Context>({
  name: 'ArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLArticle,
      resolve({articleID}, _args, {loaders}) {
        return loaders.articles.load(articleID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Article
  }
})

export const GraphQLExternalNavigationLink = new GraphQLObjectType({
  name: 'ExternalNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.External
  }
})

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

export const GraphQLPublishedPageNavigationLink = new GraphQLObjectType<
  PageNavigationLink,
  Context
>({
  name: 'PublishedPageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    page: {
      type: GraphQLPage,
      resolve({pageID}, _args, {loaders}) {
        return loaders.publishedPagesByID.load(pageID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Page
  }
})

export const GraphQLPublishedArticleNavigationLink = new GraphQLObjectType<
  ArticleNavigationLink,
  Context
>({
  name: 'PublishedArticleNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: GraphQLNonNull(GraphQLString)},
    article: {
      type: GraphQLArticle,
      resolve({articleID}, _args, {loaders}) {
        return loaders.publishedArticles.load(articleID)
      }
    }
  },
  isTypeOf(value) {
    return value.type === NavigationLinkType.Article
  }
})

export const GraphQLPublicNavigationLink = new GraphQLUnionType({
  name: 'PublicNavigationLink',
  types: [
    GraphQLPublishedPageNavigationLink,
    GraphQLPublishedArticleNavigationLink,
    GraphQLExternalNavigationLink
  ]
})

export const GraphQLPublicNavigation = new GraphQLObjectType({
  name: 'PublicNavigation',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    key: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    links: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigationLink)))}
  }
})
