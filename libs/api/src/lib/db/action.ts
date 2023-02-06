import {Article} from './article'
import {Page} from './page'
import {Comment} from './comment'
import {Author} from './author'
import {Subscription, Event, Poll, User} from '@prisma/client'

export enum ActionType {
  ArticleCreate = 'articleCreate',
  PageCreate = 'pageCreate',
  CommentCreate = 'commentCreate',
  SubscriptionCreate = 'subscriptionCreate',
  AuthorCreate = 'authorCreate',
  PollStart = 'pollStart',
  UserCreate = 'userCreate',
  EventCreate = 'eventCreate'
}

export interface Action {
  date: Date
  actionType: ActionType
  id: string
  item?: Article | Page | Comment | Author | Poll | Subscription | Event | User
}
