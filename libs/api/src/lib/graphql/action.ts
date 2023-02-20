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
  name: 'ArticleCreatedAction',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    article: {
      type: GraphQLNonNull(GraphQLArticle),
      async resolve({id}, args, {loaders}) {
        return await loaders.articles.load(id)
      }
    }
  },
  interfaces: () => []
})

const GraphQLPageCreatedAction = new GraphQLObjectType({
  name: 'PageCreatedAction',
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

const GraphQLCommentCreatedAction = new GraphQLObjectType({
  name: 'CommentCreatedAction',
  fields: {
    ...actionFields,
    comment: {
      type: GraphQLNonNull(GraphQLComment),
      async resolve({id}, args, {loaders}) {
        return await loaders.commentById.load(id)
      }
    }
  }
})

const GraphQLPollStartedAction = new GraphQLObjectType({
  name: 'PollStartedAction',
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

const GraphQLSubscriptionCreatedAction = new GraphQLObjectType({
  name: 'SubscriptionCreatedAction',
  fields: {
    ...actionFields,
    subscription: {
      type: GraphQLNonNull(GraphQLSubscription),
      async resolve({id}, args, {loaders}) {
        return await loaders.subscriptionById.load(id)
      }
    }
  }
})

const GraphQLAuthorCreatedAction = new GraphQLObjectType({
  name: 'AuthorCreatedAction',
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

const GraphQLUserCraetedAction = new GraphQLObjectType({
  name: 'UserCreatedAction',
  fields: {
    ...actionFields,
    user: {
      type: GraphQLNonNull(GraphQLUser),
      async resolve({id}, args, {loaders}) {
        return await loaders.userById.load(id)
      }
    }
  }
})

const GraphQLEventCreatedAction = new GraphQLObjectType({
  name: 'EventCreatedAction',
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
    GraphQLUserCraetedAction,
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
        return GraphQLUserCraetedAction
      case ActionType.EventCreated:
        return GraphQLEventCreatedAction
    }
  }
})
