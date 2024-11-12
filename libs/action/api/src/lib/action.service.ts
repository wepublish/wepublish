import {Injectable} from '@nestjs/common'
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
import {UserRole} from '@wepublish/user-role/api'
import {AbstractAction, ActionType} from './action.model'

@Injectable()
export class ActionService {
  constructor(readonly prisma: PrismaClient) {}

  async getActions(roles: UserRole[]) {
    const {article, page, comment, subscription, author, poll, user, event} = this.prisma

    const articles = hasPermission(CanGetArticles, roles)
      ? article
          .findMany({
            take: 50,
            include: {draft: true, pending: true, published: true},
            orderBy: {createdAt: 'desc'}
          })
          .then(val =>
            val.map((article: Article) => {
              return {
                date: article.createdAt,
                actionType: ActionType.ArticleCreated,
                id: article.id
              }
            })
          )
      : []
    const pages = hasPermission(CanGetPages, roles)
      ? page
          .findMany({
            take: 50,
            include: {draft: true, pending: true, published: true},
            orderBy: {createdAt: 'desc'}
          })
          .then(val =>
            val.map((page: Page) => {
              return {
                date: page.createdAt,
                actionType: ActionType.PageCreated,
                id: page.id
              }
            })
          )
      : []
    const comments = hasPermission(CanGetComments, roles)
      ? comment
          .findMany({take: 50, include: {revisions: true}, orderBy: {createdAt: 'desc'}})
          .then(val =>
            val.map((comment: Comment) => {
              return {
                date: comment.createdAt,
                actionType: ActionType.CommentCreated,
                id: comment.id
              }
            })
          )
      : []
    const authors = hasPermission(CanGetAuthors, roles)
      ? author.findMany({take: 50, orderBy: {createdAt: 'desc'}}).then(val =>
          val.map((author: Author) => {
            return {
              date: author.createdAt,
              actionType: ActionType.AuthorCreated,
              id: author.id
            }
          })
        )
      : []
    const subscriptions = hasPermission(CanGetSubscriptions, roles)
      ? subscription.findMany({take: 50, orderBy: {createdAt: 'desc'}}).then(val =>
          val.map((subscription: Subscription) => {
            return {
              date: subscription.createdAt,
              actionType: ActionType.SubscriptionCreated,
              id: subscription.id
            }
          })
        )
      : []
    const polls = hasPermission(CanGetPoll, roles)
      ? poll.findMany({take: 50, orderBy: {createdAt: 'desc'}}).then(val =>
          val.map((poll: Poll) => {
            return {
              date: poll.opensAt,
              actionType: ActionType.PollStarted,
              id: poll.id
            }
          })
        )
      : []
    const users = hasPermission(CanGetUsers, roles)
      ? user.findMany({take: 50, orderBy: {createdAt: 'desc'}}).then(val =>
          val.map((user: User) => {
            return {
              date: user.createdAt,
              actionType: ActionType.UserCreated,
              id: user.id
            }
          })
        )
      : []
    const events = hasPermission(CanGetEvent, roles)
      ? event.findMany({take: 50, orderBy: {createdAt: 'desc'}}).then(val =>
          val.map((event: Event) => {
            return {
              date: event.createdAt,
              actionType: ActionType.EventCreated,
              id: event.id
            }
          })
        )
      : []
    const actions = (
      await Promise.all([articles, pages, comments, authors, subscriptions, polls, users, events])
    ).flat()

    return actions
      .sort((v1: AbstractAction, v2: AbstractAction) => v2.date.getTime() - v1.date.getTime())
      .slice(0, 50)
  }
}
