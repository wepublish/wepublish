import {
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLUnionType
} from 'graphql'
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

const GraphQLArticleAction = new GraphQLObjectType({
  name: 'ArticleAction',
  fields: {
    article: {type: GraphQLArticle}
  }
})

const GraphQLPageAction = new GraphQLObjectType({
  name: 'PageAction',
  fields: {
    page: {type: GraphQLPage}
  }
})

const GraphQLCommentAction = new GraphQLObjectType({
  name: 'CommentAction',
  fields: {
    comment: {type: GraphQLComment}
  }
})

const GraphQLPollAction = new GraphQLObjectType({
  name: 'PollAction',
  fields: {
    poll: {type: GraphQLPoll}
  }
})

const GraphQLSubscriptionAction = new GraphQLObjectType({
  name: 'SubscriptionAction',
  fields: {
    subscription: {type: GraphQLSubscription}
  }
})

const GraphQLAuthorAction = new GraphQLObjectType({
  name: 'AuthorAction',
  fields: {
    author: {type: GraphQLAuthor}
  }
})

const GraphQLUserAction = new GraphQLObjectType({
  name: 'UserAction',
  fields: {
    user: {type: GraphQLUser}
  }
})

const GraphQLEventAction = new GraphQLObjectType({
  name: 'EventAction',
  fields: {
    event: {type: GraphQLEvent}
  }
})

export const GraphQLActionItem = new GraphQLUnionType({
  name: 'ActionItem',
  types: [
    GraphQLArticleAction,
    GraphQLPageAction,
    GraphQLCommentAction,
    GraphQLPollAction,
    GraphQLSubscriptionAction,
    GraphQLAuthorAction,
    GraphQLUserAction,
    GraphQLEventAction
  ],
  resolveType(value) {
    if (value.article) return GraphQLArticleAction
    if (value.page) return GraphQLPageAction
    if (value.comment) return GraphQLCommentAction
    if (value.subscription) return GraphQLSubscriptionAction
    if (value.user) return GraphQLUserAction
    if (value.event) return GraphQLEventAction
    if (value.poll) return GraphQLPollAction
    if (value.author) return GraphQLAuthorAction
    return null
  }
})

export const GraphQLAction = new GraphQLObjectType<Action>({
  name: 'Action',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    actionType: {type: GraphQLNonNull(GraphQLActionType)},
    item: {
      type: GraphQLActionItem,
      async resolve({id, actionType}, args, {loaders}) {
        // TODO add missing loaders
        if (actionType === ActionType.ArticleCreate)
          return {article: await loaders.articles.load(id)}
        if (actionType === ActionType.PageCreate) return {page: await loaders.pages.load(id)}
        // if (actionType === ActionType.CommentCreate)
        //   return {comment: await loaders.comment.load(id)}
        if (actionType === ActionType.AuthorCreate)
          return {author: await loaders.authorsByID.load(id)}
        if (actionType === ActionType.PollStart) return {poll: await loaders.pollById.load(id)}
        // if (actionType === ActionType.SubscriptionCreate) return {subscription: await loaders. .load(id)}
        // if (actionType === ActionType.UserCreate) return {user: await loaders. .load(id)}
        if (actionType === ActionType.EventCreate) return {event: await loaders.eventById.load(id)}
        return null
      }
    }
  }
})
