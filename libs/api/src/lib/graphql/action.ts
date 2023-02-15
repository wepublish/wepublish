import {GraphQLEnumType, GraphQLObjectType, GraphQLNonNull, GraphQLUnionType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Action, ActionType} from '../db/action'
import {GraphQLPage} from './page'
import {GraphQLPoll} from './poll/poll'
import {GraphQLArticle} from './article'
import {GraphQLAuthor} from './author'
import {GraphQLComment} from './comment/comment'
import {GraphQLSubscription} from './subscription'
import {GraphQLUser} from './user'
import {GraphQLEvent} from './event/event'

export const GraphQLActionType = new GraphQLEnumType({
  name: 'ActionType',
  values: {
    ARTICLE_CREATE: {value: ActionType.ArticleCreate},
    PAGE_CREATE: {value: ActionType.PageCreate},
    COMMENT_CREATE: {value: ActionType.CommentCreate},
    SUBSCRIPTION_CREATE: {value: ActionType.SubscriptionCreate},
    AUTHOR_CREATE: {value: ActionType.AuthorCreate},
    POLL_START: {value: ActionType.PollStart},
    USER_CREATE: {value: ActionType.UserCreate},
    EVENT_CREATE: {value: ActionType.EventCreate}
  }
})

export const GraphQLActionItem = new GraphQLUnionType({
  name: 'ActionItem',
  types: [
    GraphQLArticle,
    GraphQLPage,
    GraphQLComment,
    GraphQLPoll,
    GraphQLSubscription,
    GraphQLAuthor,
    GraphQLUser,
    GraphQLEvent
  ],
  resolveType({actionType}) {
    if (actionType === ActionType.ArticleCreate) return GraphQLArticle
    if (actionType === ActionType.PageCreate) return GraphQLPage
    if (actionType === ActionType.CommentCreate) return GraphQLComment
    if (actionType === ActionType.SubscriptionCreate) return GraphQLSubscription
    if (actionType === ActionType.UserCreate) return GraphQLUser
    if (actionType === ActionType.EventCreate) return GraphQLEvent
    if (actionType === ActionType.PollStart) return GraphQLPoll
    if (actionType === ActionType.AuthorCreate) return GraphQLAuthor
    return null
  }
})

export const GraphQLAction = new GraphQLObjectType<Action>({
  name: 'Action',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    actionType: {type: GraphQLNonNull(GraphQLActionType)},
    item: {
      type: GraphQLActionItem,
      async resolve({actionType, item}, {}, {}) {
        return {actionType, ...item}
      }
    }
  }
})
