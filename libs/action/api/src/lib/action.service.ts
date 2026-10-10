import { Injectable } from '@nestjs/common';
import {
  Author,
  Article,
  Comment,
  Page,
  Poll,
  PrismaClient,
  Subscription,
  User,
  Event,
} from '@prisma/client';
import { ActionType } from './action.model';

@Injectable()
export class ActionService {
  constructor(readonly prisma: PrismaClient) {}

  async getActions(types?: ActionType[] | null) {
    const articles = () =>
      this.prisma.article
        .findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
        })
        .then(val =>
          val.map((article: Article) => {
            return {
              date: article.createdAt,
              actionType: ActionType.ArticleCreated,
              articleId: article.id,
            };
          })
        );

    const pages = () =>
      this.prisma.page
        .findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
        })
        .then(val =>
          val.map((page: Page) => {
            return {
              date: page.createdAt,
              actionType: ActionType.PageCreated,
              pageId: page.id,
            };
          })
        );

    const comments = () =>
      this.prisma.comment
        .findMany({
          take: 50,
          include: { revisions: true },
          orderBy: { createdAt: 'desc' },
        })
        .then(val =>
          val.map((comment: Comment) => {
            return {
              date: comment.createdAt,
              actionType: ActionType.CommentCreated,
              commentId: comment.id,
            };
          })
        );

    const authors = () =>
      this.prisma.author
        .findMany({ take: 50, orderBy: { createdAt: 'desc' } })
        .then(val =>
          val.map((author: Author) => {
            return {
              date: author.createdAt,
              actionType: ActionType.AuthorCreated,
              authorId: author.id,
            };
          })
        );

    const subscriptions = () =>
      this.prisma.subscription
        .findMany({ take: 50, orderBy: { createdAt: 'desc' } })
        .then(val =>
          val.map((subscription: Subscription) => {
            return {
              date: subscription.createdAt,
              actionType: ActionType.SubscriptionCreated,
              subscriptionId: subscription.id,
            };
          })
        );

    const polls = () =>
      this.prisma.poll
        .findMany({ take: 50, orderBy: { createdAt: 'desc' } })
        .then(val =>
          val.map((poll: Poll) => {
            return {
              date: poll.opensAt,
              actionType: ActionType.PollStarted,
              pollId: poll.id,
            };
          })
        );

    const users = () =>
      this.prisma.user
        .findMany({ take: 50, orderBy: { createdAt: 'desc' } })
        .then(val =>
          val.map((user: User) => {
            return {
              date: user.createdAt,
              actionType: ActionType.UserCreated,
              userId: user.id,
            };
          })
        );

    const events = () =>
      this.prisma.event
        .findMany({ take: 50, orderBy: { createdAt: 'desc' } })
        .then(val =>
          val.map((event: Event) => {
            return {
              date: event.createdAt,
              actionType: ActionType.EventCreated,
              eventId: event.id,
            };
          })
        );

    const loaders = {
      [ActionType.ArticleCreated]: articles,
      [ActionType.PageCreated]: pages,
      [ActionType.CommentCreated]: comments,
      [ActionType.AuthorCreated]: authors,
      [ActionType.SubscriptionCreated]: subscriptions,
      [ActionType.PollStarted]: polls,
      [ActionType.UserCreated]: users,
      [ActionType.EventCreated]: events,
    };

    // no or an empty selection means every type
    const selected =
      types?.length ? types : (Object.keys(loaders) as ActionType[]);

    const actions = (
      await Promise.all(selected.map(type => loaders[type]()))
    ).flat();

    return actions
      .sort((v1, v2) => v2.date.getTime() - v1.date.getTime())
      .slice(0, 50);
  }
}
