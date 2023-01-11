import {PrismaClient} from '@prisma/client'
import {EventType} from '../../db/activityEvent'
import {Context} from '../../context'
import {
  CanGetArticles,
  CanGetAuthors,
  CanGetComments,
  CanGetPages,
  CanGetPoll,
  CanGetSubscriptions,
  CanGetUsers,
  isAuthorised
} from '../permissions'

export const getActivities = async (
  authenticate: Context['authenticate'],
  article: PrismaClient['article'],
  page: PrismaClient['page'],
  comment: PrismaClient['comment'],
  subscription: PrismaClient['subscription'],
  author: PrismaClient['author'],
  poll: PrismaClient['poll'],
  user: PrismaClient['user']
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
          eventType: EventType.Article,
          id: value.id,
          summary:
            value?.published?.title ?? value?.pending?.title ?? value?.draft?.title ?? undefined
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
          eventType: EventType.Page,
          id: value.id,
          summary: value?.published?.title ?? value?.pending?.title ?? value?.draft?.title ?? null
        }
      })
    : []
  const comments = isAuthorised(CanGetComments, roles)
    ? (await comment.findMany({take: 5, include: {user: true}})).map((value: any) => {
        return {
          date: value.createdAt,
          eventType: EventType.Comment,
          id: value.id,
          creator: value.user.name ?? value.guestUsername
        }
      })
    : []
  const authors = isAuthorised(CanGetAuthors, roles)
    ? (await author.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          eventType: EventType.Author,
          id: value.id,
          summary: `${value?.name ?? ''} ${value?.jobTitle ? ', ' + value.jobTitle : ''}`
        }
      })
    : []
  const subscriptions = isAuthorised(CanGetSubscriptions, roles)
    ? (await subscription.findMany({take: 5, include: {memberPlan: true, user: true}})).map(
        (value: any) => {
          return {
            date: value.createdAt,
            eventType: EventType.Subscription,
            id: value.id,
            summary: `on ${value?.memberPlan.name}`,
            creator: value?.user?.name
          }
        }
      )
    : []
  const polls = isAuthorised(CanGetPoll, roles)
    ? (await poll.findMany({take: 5})).map((value: any) => {
        return {
          date: value.opensAt,
          eventType: EventType.Poll,
          id: value.id,
          summary: value.question
        }
      })
    : []
  const users = isAuthorised(CanGetUsers, roles)
    ? (await user.findMany({take: 5})).map((value: any) => {
        return {
          date: value.createdAt,
          eventType: EventType.User,
          id: value.id,
          summary: value.name
        }
      })
    : []
  const activityEvents = [
    ...articles,
    ...pages,
    ...comments,
    ...authors,
    ...subscriptions,
    ...polls,
    ...users
  ]
  return activityEvents.sort((v1, v2) => v2.date - v1.date)
}
