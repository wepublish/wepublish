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

export const GraphQLTrackingPixelPublic = new GraphQLObjectType<ArticleTrackingPixels, Context>({
  name: 'TrackingPixel',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    trackingPixelProviderType: {type: new GraphQLNonNull(GraphQLTrackingPixelProviderType)},
    uri: {type: GraphQLString}
  }
})

export const GraphQLTrackingPixel = new GraphQLObjectType<ArticleTrackingPixels, Context>({
  name: 'TrackingPixel',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    trackingPixelProviderID: {type: new GraphQLNonNull(GraphQLString)},
    trackingPixelProviderType: {type: new GraphQLNonNull(GraphQLTrackingPixelProviderType)},
    uri: {type: GraphQLString},
    error: {type: GraphQLString}
  }
})
