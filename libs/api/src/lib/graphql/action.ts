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
    ARTICLE_CREATED: {value: ActionType.ArticleCreated},
    PAGE_CREATED: {value: ActionType.PageCreated},
    COMMENT_CREATED: {value: ActionType.CommentCreated},
    SUBSCRIPTION_CREATED: {value: ActionType.SubscriptionCreated},
    AUTHOR_CREATED: {value: ActionType.AuthorCreated},
    POLL_STARTED: {value: ActionType.PollStarted},
    USER_CREATED: {value: ActionType.UserCreated},
    EVENT_CREATED: {value: ActionType.EventCreated}
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
    if (actionType === ActionType.ArticleCreated) return GraphQLArticle
    if (actionType === ActionType.PageCreated) return GraphQLPage
    if (actionType === ActionType.CommentCreated) return GraphQLComment
    if (actionType === ActionType.SubscriptionCreated) return GraphQLSubscription
    if (actionType === ActionType.UserCreated) return GraphQLUser
    if (actionType === ActionType.EventCreated) return GraphQLEvent
    if (actionType === ActionType.PollStarted) return GraphQLPoll
    if (actionType === ActionType.AuthorCreated) return GraphQLAuthor
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
      async resolve({actionType, item}) {
        return {actionType, ...item}
      }
    }
  }
})
