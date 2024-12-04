import {GraphQLObjectType, GraphQLNonNull, GraphQLUnionType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Action, ActionType} from '../db/action'
import {GraphQLPoll} from './poll/poll'
import {GraphQLAuthor} from './author'
import {GraphQLComment} from './comment/comment'
import {GraphQLSubscription} from './subscription'
import {GraphQLUser} from './user'
import {GraphQLEvent} from './event/event'
import {Context} from '../context'
import {Article} from '@wepublish/article/api'
import {Page} from '@wepublish/page/api'

const actionFields = {
  date: {type: new GraphQLNonNull(GraphQLDateTime)}
}

const GraphQLArticleCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'ArticleCreatedAction',
  fields: {
    ...actionFields,
    article: {
      type: new GraphQLNonNull(Article),
      async resolve({id}, args, {loaders}) {
        return {
          __typename: 'Article',
          id
        }
      }
    }
  }
})

const GraphQLPageCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'PageCreatedAction',
  fields: {
    ...actionFields,
    page: {
      type: new GraphQLNonNull(Page),
      async resolve({id}, args, {loaders}) {
        return {
          __typename: 'Page',
          id
        }
      }
    }
  }
})

const GraphQLCommentCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'CommentCreatedAction',
  fields: {
    ...actionFields,
    comment: {
      type: new GraphQLNonNull(GraphQLComment),
      async resolve({id}, args, {loaders}) {
        return await loaders.commentsById.load(id)
      }
    }
  }
})

const GraphQLPollStartedAction = new GraphQLObjectType<Action, Context>({
  name: 'PollStartedAction',
  fields: {
    ...actionFields,
    poll: {
      type: new GraphQLNonNull(GraphQLPoll),
      async resolve({id}, args, {loaders}) {
        return await loaders.pollById.load(id)
      }
    }
  }
})

const GraphQLSubscriptionCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'SubscriptionCreatedAction',
  fields: {
    ...actionFields,
    subscription: {
      type: new GraphQLNonNull(GraphQLSubscription),
      async resolve({id}, args, {loaders}) {
        return await loaders.subscriptionsById.load(id)
      }
    }
  }
})

const GraphQLAuthorCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'AuthorCreatedAction',
  fields: {
    ...actionFields,
    author: {
      type: new GraphQLNonNull(GraphQLAuthor),
      async resolve({id}, args, {loaders}) {
        return await loaders.authorsByID.load(id)
      }
    }
  }
})

const GraphQLUserCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'UserCreatedAction',
  fields: {
    ...actionFields,
    user: {
      type: new GraphQLNonNull(GraphQLUser),
      async resolve({id}, args, {loaders}) {
        return await loaders.usersById.load(id)
      }
    }
  }
})

const GraphQLEventCreatedAction = new GraphQLObjectType<Action, Context>({
  name: 'EventCreatedAction',
  fields: {
    ...actionFields,
    event: {
      type: new GraphQLNonNull(GraphQLEvent),
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
  async resolveType(value: Action) {
    switch (value.actionType) {
      case ActionType.ArticleCreated:
        return GraphQLArticleCreatedAction.name
      case ActionType.PageCreated:
        return GraphQLPageCreatedAction.name
      case ActionType.CommentCreated:
        return GraphQLCommentCreatedAction.name
      case ActionType.PollStarted:
        return GraphQLPollStartedAction.name
      case ActionType.SubscriptionCreated:
        return GraphQLSubscriptionCreatedAction.name
      case ActionType.AuthorCreated:
        return GraphQLAuthorCreatedAction.name
      case ActionType.UserCreated:
        return GraphQLUserCreatedAction.name
      case ActionType.EventCreated:
        return GraphQLEventCreatedAction.name
    }
  }
})
