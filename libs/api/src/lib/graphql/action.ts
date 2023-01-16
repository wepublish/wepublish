import {GraphQLEnumType, GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Action, ActionType} from '../db/action'

export const GraphQLActionType = new GraphQLEnumType({
  name: 'ActionType',
  values: {
    ARTICLE: {value: ActionType.Article},
    PAGE: {value: ActionType.Page},
    COMMENT: {value: ActionType.Comment},
    SUBSCRIPTION: {value: ActionType.Subscription},
    AUTHOR: {value: ActionType.Author},
    POLL: {value: ActionType.Poll},
    USER: {value: ActionType.User}
  }
})

export const GraphQLAction = new GraphQLObjectType<Action>({
  name: 'Action',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    actionType: {type: GraphQLNonNull(GraphQLActionType)},
    creator: {type: GraphQLString},
    summary: {type: GraphQLString}
  }
})
