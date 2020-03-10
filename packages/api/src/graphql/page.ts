import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLInt
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {Context} from '../context'

import {
  GraphQLRichTextBlock,
  GraphQLImageBlock,
  GraphQLInputRichTextBlock,
  GraphQLTitleBlock,
  GraphQLInputImageBlock,
  GraphQLInputTitleBlock,
  GraphQLInputLinkPageBreakBlock,
  GraphQLArticleTeaserGridBlockInput,
  GraphQLArticleTeaserGridBlock,
  GraphQLPublicArticleTeaserGridBlock,
  GraphQLLinkPageBreakBlock
} from './blocks'

import {GraphQLImage} from './image'
import {BlockType} from '../db/block'
import {PublicPage, PageRevision, Page, PageSort} from '../db/page'
import {GraphQLSlug} from './slug'
import {GraphQLPageInfo} from './common'

export const GraphQLPageBlockUnionMap = new GraphQLInputObjectType({
  name: 'PageBlockUnionMap',
  fields: {
    [BlockType.RichText]: {type: GraphQLInputRichTextBlock},
    [BlockType.Image]: {type: GraphQLInputImageBlock},
    [BlockType.Title]: {type: GraphQLInputTitleBlock},
    [BlockType.ArticleTeaserGrid]: {type: GraphQLArticleTeaserGridBlockInput},
    [BlockType.LinkPageBreak]: {type: GraphQLInputLinkPageBreakBlock}
  }
})

export const GraphQLPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [
    GraphQLRichTextBlock,
    GraphQLTitleBlock,
    GraphQLImageBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLArticleTeaserGridBlock
  ]
})

export const GraphQLPublicPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [
    GraphQLRichTextBlock,
    GraphQLTitleBlock,
    GraphQLImageBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLPublicArticleTeaserGridBlock
  ]
})

export const GraphQLPageFilter = new GraphQLInputObjectType({
  name: 'PageFilter',
  fields: {
    title: {type: GraphQLString},
    draft: {type: GraphQLBoolean},
    published: {type: GraphQLBoolean},
    pending: {type: GraphQLBoolean},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublishedPageFilter = new GraphQLInputObjectType({
  name: 'PublishedPageFilter',
  fields: {
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPageSort = new GraphQLEnumType({
  name: 'PageSort',
  values: {
    CREATED_AT: {value: PageSort.CreatedAt},
    MODIFIED_AT: {value: PageSort.ModifiedAt},
    PUBLISH_AT: {value: PageSort.PublishAt},
    PUBLISHED_AT: {value: PageSort.PublishedAt},
    UPDATED_AT: {value: PageSort.UpdatedAt}
  }
})

export const GraphQLPublishedPageSort = new GraphQLEnumType({
  name: 'PublishedPageSort',
  values: {
    PUBLISHED_AT: {value: PageSort.PublishedAt},
    UPDATED_AT: {value: PageSort.UpdatedAt}
  }
})

export const GraphQLPageInput = new GraphQLInputObjectType({
  name: 'PageInput',
  fields: {
    slug: {type: GraphQLNonNull(GraphQLSlug)},

    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    imageID: {type: GraphQLID},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlockUnionMap)))
    }
  }
})

export const GraphQLPageRevision = new GraphQLObjectType<PageRevision, Context>({
  name: 'PageRevision',
  fields: {
    revision: {type: GraphQLNonNull(GraphQLInt)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    slug: {type: GraphQLNonNull(GraphQLSlug)},

    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}, info) {
        return imageID ? loaders.images.load(imageID) : null
      }
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlock)))}
  }
})

export const GraphQLPage = new GraphQLObjectType<Page, Context>({
  name: 'Page',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    draft: {type: GraphQLPageRevision},
    published: {type: GraphQLPageRevision},
    pending: {type: GraphQLPageRevision},

    latest: {
      type: GraphQLNonNull(GraphQLPageRevision),
      resolve({draft, pending, published}) {
        return draft ?? pending ?? published
      }
    }

    // TODO: Implement page history
    // history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageRevision)))}
  }
})

export const GraphQLPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPage)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicPage = new GraphQLObjectType<PublicPage, Context>({
  name: 'Page',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    slug: {type: GraphQLNonNull(GraphQLSlug)},

    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve(page, {}, {urlAdapter}) {
        return urlAdapter.getPublicPageURL(page)
      }
    },

    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}, info) {
        return imageID ? loaders.images.load(imageID) : null
      }
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicPageBlock)))}
  }
})

export const GraphQLPublicPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicPage)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
