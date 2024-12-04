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
import {createProxyingResolver, createProxyingIsTypeOf} from '../utility'
import {Page} from '@wepublish/page/api'
import {Article} from '@wepublish/article/api'

export const GraphQLBaseNavigationLink = new GraphQLInterfaceType({
  name: 'BaseNavigationLink',
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)},
    page: {
      type: Page,
      resolve: createProxyingResolver(({pageID}, _args, {loaders}) => {
        return {
          __typename: 'Page',
          id: pageID
        }
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
    label: {type: new GraphQLNonNull(GraphQLString)},
    article: {
      type: Article,
      resolve: createProxyingResolver(({articleID}, _args, {loaders}) => {
        return {
          __typename: 'Article',
          id: articleID
        }
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
      label: {type: new GraphQLNonNull(GraphQLString)},
      url: {type: new GraphQLNonNull(GraphQLString)}
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
    id: {type: new GraphQLNonNull(GraphQLID)},
    key: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    links: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLNavigationLink)))}
  }
})

export const GraphQLPublicPageNavigationLink = new GraphQLObjectType<PageNavigationLink, Context>({
  name: 'PageNavigationLink',
  interfaces: [GraphQLBaseNavigationLink],
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)},
    page: {
      type: Page,
      resolve: createProxyingResolver(({pageID}, _args, {loaders}) => {
        return {
          __typename: 'Page',
          id: pageID
        }
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
    label: {type: new GraphQLNonNull(GraphQLString)},
    article: {
      type: Article,
      resolve: createProxyingResolver(({articleID}, _args, {loaders}) => {
        return {
          __typename: 'Article',
          id: articleID
        }
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
    id: {type: new GraphQLNonNull(GraphQLID)},
    key: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    links: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicNavigationLink)))
    }
  }
})

export const GraphQLArticleNavigationLinkInput = new GraphQLInputObjectType({
  name: 'ArticleNavigationLinkInput',
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)},
    articleID: {type: new GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLPageNavigationLinkInput = new GraphQLInputObjectType({
  name: 'PageNavigationLinkInput',
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)},
    pageID: {type: new GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLExternalNavigationLinkInput = new GraphQLInputObjectType({
  name: 'ExternalNavigationLinkInput',
  fields: {
    label: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLString)}
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
    key: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    links: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLNavigationLinkInput)))
    }
  }
})
