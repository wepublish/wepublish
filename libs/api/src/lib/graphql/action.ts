import {GraphQLObjectType, GraphQLNonNull, GraphQLUnionType} from 'graphql'
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

const actionFields = {
  date: {type: GraphQLNonNull(GraphQLDateTime)}
}

const GraphQLArticleCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.ArticleCreated,
  fields: {
    ...actionFields,
    article: {
      type: GraphQLNonNull(GraphQLArticle),
      async resolve({id}, args, {loaders}) {
        return await loaders.articles.load(id)
      }
    }
  }
})

const GraphQLPageCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.PageCreated,
  fields: {
    ...actionFields,
    page: {
      type: GraphQLNonNull(GraphQLPage),
      async resolve({id}, args, {loaders}) {
        return await loaders.pages.load(id)
      }
    }
  }
})

const GraphQLCommentCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.CommentCreated,
  fields: {
    ...actionFields,
    comment: {
      type: GraphQLNonNull(GraphQLComment),
      async resolve({id}, args, {loaders}) {
        return await loaders.commentsById.load(id)
      }
    }
  }
})

const GraphQLPollStartedAction = new GraphQLObjectType<Action>({
  name: ActionType.PollStarted,
  fields: {
    ...actionFields,
    poll: {
      type: GraphQLNonNull(GraphQLPoll),
      async resolve({id}, args, {loaders}) {
        return await loaders.pollById.load(id)
      }
    }
  }
})

const GraphQLSubscriptionCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.SubscriptionCreated,
  fields: {
    ...actionFields,
    subscription: {
      type: GraphQLNonNull(GraphQLSubscription),
      async resolve({id}, args, {loaders}) {
        return await loaders.subscriptionsById.load(id)
      }
    }
  }
})

const GraphQLAuthorCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.AuthorCreated,
  fields: {
    ...actionFields,
    author: {
      type: GraphQLNonNull(GraphQLAuthor),
      async resolve({id}, args, {loaders}) {
        return await loaders.authorsByID.load(id)
      }
    }
  }
})

const GraphQLUserCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.UserCreated,
  fields: {
    ...actionFields,
    user: {
      type: GraphQLNonNull(GraphQLUser),
      async resolve({id}, args, {loaders}) {
        return await loaders.usersById.load(id)
      }
    }
  }
})

const GraphQLEventCreatedAction = new GraphQLObjectType<Action>({
  name: ActionType.EventCreated,
  fields: {
    ...actionFields,
    event: {
      type: GraphQLNonNull(GraphQLEvent),
      async resolve({id}, args, {loaders}) {
        return await loaders.eventById.load(id)
      }
    }
  }
})

export const GraphQLAction = new GraphQLUnionType({
  name: 'Action',
  types: [
    GraphQLArticleCreatedAction,
    GraphQLPageCreatedAction,
    GraphQLCommentCreatedAction,
    GraphQLPollStartedAction,
    GraphQLSubscriptionCreatedAction,
    GraphQLAuthorCreatedAction,
    GraphQLUserCreatedAction,
    GraphQLEventCreatedAction
  ],
  resolveType(value: Action) {
    switch (value.actionType) {
      case ActionType.ArticleCreated:
        return GraphQLArticleCreatedAction
      case ActionType.PageCreated:
        return GraphQLPageCreatedAction
      case ActionType.CommentCreated:
        return GraphQLCommentCreatedAction
      case ActionType.PollStarted:
        return GraphQLPollStartedAction
      case ActionType.SubscriptionCreated:
        return GraphQLSubscriptionCreatedAction
      case ActionType.AuthorCreated:
        return GraphQLAuthorCreatedAction
      case ActionType.UserCreated:
        return GraphQLUserCreatedAction
      case ActionType.EventCreated:
        return GraphQLEventCreatedAction
    }
  }
})
