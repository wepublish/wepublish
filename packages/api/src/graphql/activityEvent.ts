import {GraphQLEnumType, GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {EventType} from '../db/activityEvent'

export const GraphQLActivityEventType = new GraphQLEnumType({
  name: 'ActivityEventType',
  values: {
    ARTICLE: {value: EventType.Article},
    PAGE: {value: EventType.Page},
    COMMENT: {value: EventType.Comment},
    SUBSCRIPTION: {value: EventType.Subscription},
    AUTHOR: {value: EventType.Author},
    POLL: {value: EventType.Poll},
    USER: {value: EventType.User}
  }
})

export const GraphQLActivityEvent = new GraphQLObjectType({
  name: 'ActivityEvent',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    eventType: {type: GraphQLNonNull(GraphQLActivityEventType)},
    creator: {type: GraphQLString},
    summary: {type: GraphQLString}
  }
})
