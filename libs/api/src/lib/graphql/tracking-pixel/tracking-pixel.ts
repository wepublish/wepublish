import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql/index'
import {ArticleTrackingPixels, TrackingPixelProviderType} from '@prisma/client'
import {Context} from '../../context'

export const GraphQLTrackingPixelProviderType = new GraphQLEnumType({
  name: 'TrackingPixelProviderType',
  values: {
    [TrackingPixelProviderType.prolitteris]: {value: TrackingPixelProviderType.prolitteris}
  }
})

export const GraphQLTrackingPixelMethod = new GraphQLObjectType<ArticleTrackingPixels, Context>({
  name: 'TrackingPixelMethod',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    trackingPixelProviderID: {type: new GraphQLNonNull(GraphQLString)},
    trackingPixelProviderType: {type: new GraphQLNonNull(GraphQLTrackingPixelProviderType)}
  }
})

export const GraphQLTrackingPixelMethodPublic = new GraphQLObjectType<
  ArticleTrackingPixels,
  Context
>({
  name: 'TrackingPixelMethod',
  fields: {
    trackingPixelProviderType: {type: new GraphQLNonNull(GraphQLTrackingPixelProviderType)}
  }
})

export const GraphQLTrackingPixelPublic = new GraphQLObjectType<ArticleTrackingPixels, Context>({
  name: 'TrackingPixel',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    trackingPixelMethod: {type: new GraphQLNonNull(GraphQLTrackingPixelMethodPublic)},
    uri: {type: GraphQLString}
  }
})

export const GraphQLTrackingPixel = new GraphQLObjectType<ArticleTrackingPixels, Context>({
  name: 'TrackingPixel',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    trackingPixelMethod: {type: new GraphQLNonNull(GraphQLTrackingPixelMethod)},
    uri: {type: GraphQLString},
    error: {type: GraphQLString}
  }
})
