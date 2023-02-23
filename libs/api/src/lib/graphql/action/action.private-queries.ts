import {
  Author,
  Article,
  Comment,
  Page,
  Poll,
  PrismaClient,
  Subscription,
  User,
  Event
} from '@prisma/client'
import {Action, ActionType} from '../../db/action'
import {Context} from '../../context'
import {
  CanGetArticles,
  CanGetAuthors,
  CanGetComments,
  CanGetEvent,
  CanGetPages,
  CanGetPoll,
  CanGetSubscriptions,
  CanGetUsers
} from '@wepublish/permissions/api'
import {hasPermission} from '@wepublish/permissions/api'

export const getActions = async (
  authenticate: Context['authenticate'],
  article: PrismaClient['article'],
  page: PrismaClient['page'],
  comment: PrismaClient['comment'],
  subscription: PrismaClient['subscription'],
  author: PrismaClient['author'],
  poll: PrismaClient['poll'],
  user: PrismaClient['user'],
  event: PrismaClient['event']
): Promise<Array<Action>> => {
  const {roles} = authenticate()

  const articles = hasPermission(CanGetArticles, roles)
    ? (
        await article.findMany({
          take: 5,
          include: {draft: true, pending: true, published: true}
        })
      ).map((article: Article) => {
        return {
          date: article.createdAt,
          actionType: ActionType.ArticleCreated,
          id: article.id
        }
      })
    : []
  const pages = hasPermission(CanGetPages, roles)
    ? (
        await page.findMany({
          take: 5,
          include: {draft: true, pending: true, published: true}
        })
      ).map((page: Page) => {
        return {
          date: page.createdAt,
          actionType: ActionType.PageCreated,
          id: page.id
        }
      })
    : []
  const comments = hasPermission(CanGetComments, roles)
    ? (await comment.findMany({take: 5, include: {revisions: true}})).map((comment: Comment) => {
        return {
          date: comment.createdAt,
          actionType: ActionType.CommentCreated,
          id: comment.id
        }
      })
    : []
  const authors = hasPermission(CanGetAuthors, roles)
    ? (await author.findMany({take: 5})).map((author: Author) => {
        return {
          date: author.createdAt,
          actionType: ActionType.AuthorCreated,
          id: author.id
        }
      })
    : []
  const subscriptions = hasPermission(CanGetSubscriptions, roles)
    ? (await subscription.findMany({take: 5})).map((subscription: Subscription) => {
        return {
          date: subscription.createdAt,
          actionType: ActionType.SubscriptionCreated,
          id: subscription.id
        }
      })
    : []
  const polls = hasPermission(CanGetPoll, roles)
    ? (await poll.findMany({take: 5})).map((poll: Poll) => {
        return {
          date: poll.opensAt,
          actionType: ActionType.PollStarted,
          id: poll.id
        }
      })
    : []
  const users = hasPermission(CanGetUsers, roles)
    ? (await user.findMany({take: 5})).map((user: User) => {
        return {
          date: user.createdAt,
          actionType: ActionType.UserCreated,
          id: user.id
        }
      })
    : []
  const events = hasPermission(CanGetEvent, roles)
    ? (await event.findMany({take: 5})).map((event: Event) => {
        return {
          date: event.createdAt,
          actionType: ActionType.EventCreated,
          id: event.id
        }
      })
    : []
  const actions = [
    ...articles,
    ...pages,
    ...comments,
    ...authors,
    ...subscriptions,
    ...polls,
    ...users,
    ...events
  ]
  return actions.sort((v1, v2) => v2.date.getDate() - v1.date.getDate())
}
