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
          id: value.id
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
          id: value.id
        }
      })
    : []
  const comments = isAuthorised(CanGetComments, roles)
    ? (await comment.findMany({take: 5, include: {user: true}})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.CommentCreate,
          id: value.id
        }
      })
    : []
  const authors = isAuthorised(CanGetAuthors, roles)
    ? (await author.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.AuthorCreate,
          id: value.id
        }
      })
    : []
  const subscriptions = isAuthorised(CanGetSubscriptions, roles)
    ? (await subscription.findMany({take: 5, include: {memberPlan: true, user: true}})).map(
        (value: any) => {
          return {
            date: value.createdAt,
            actionType: ActionType.SubscriptionCreate,
            id: value.id
          }
        }
      )
    : []
  const polls = isAuthorised(CanGetPoll, roles)
    ? (await poll.findMany({take: 5})).map((value: any) => {
        return {
          date: value.opensAt,
          actionType: ActionType.PollStart,
          id: value.id
        }
      })
    : []
  const users = isAuthorised(CanGetUsers, roles)
    ? (await user.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.UserCreate,
          id: value.id
        }
      })
    : []
  const events = isAuthorised(CanGetEvent, roles)
    ? (await event.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          actionType: ActionType.EventCreate,
          id: value.id
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
