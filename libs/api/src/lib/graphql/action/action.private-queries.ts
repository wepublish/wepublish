import {PrismaClient} from '@prisma/client'
import {ActionType} from '../../db/action'
import {Context} from '../../context'
import {
  CanGetArticles,
  CanGetAuthors,
  CanGetComments,
  CanGetEvent,
  CanGetPages,
  CanGetPoll,
  CanGetSubscriptions,
  CanGetUsers,
  isAuthorised
} from '../permissions'

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
) => {
  const {roles} = authenticate()

  const articles = isAuthorised(CanGetArticles, roles)
    ? (
        await article.findMany({
          take: 5,
          include: {draft: true, pending: true, published: true}
        })
      ).map(value => {
        return {
          date: value.createdAt,
          actionType: ActionType.ArticleCreate,
          item: value
        }
      })
    : []
  const pages = isAuthorised(CanGetPages, roles)
    ? (
        await page.findMany({
          take: 5,
          include: {draft: true, pending: true, published: true}
        })
      ).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.PageCreate,
          item: value
        }
      })
    : []
  const comments = isAuthorised(CanGetComments, roles)
    ? (await comment.findMany({take: 5, include: {revisions: true}})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.CommentCreate,
          item: value
        }
      })
    : []
  const authors = isAuthorised(CanGetAuthors, roles)
    ? (await author.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.AuthorCreate,
          item: value
        }
      })
    : []
  const subscriptions = isAuthorised(CanGetSubscriptions, roles)
    ? (await subscription.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.SubscriptionCreate,
          item: value
        }
      })
    : []
  const polls = isAuthorised(CanGetPoll, roles)
    ? (await poll.findMany({take: 5})).map((value: any) => {
        return {
          date: value.opensAt,
          actionType: ActionType.PollStart,
          item: value
        }
      })
    : []
  const users = isAuthorised(CanGetUsers, roles)
    ? (await user.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.UserCreate,
          item: value
        }
      })
    : []
  const events = isAuthorised(CanGetEvent, roles)
    ? (await event.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.EventCreate,
          item: value
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
  return actions.sort((v1, v2) => v2.date - v1.date)
}
