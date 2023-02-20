import {Article} from './article'
import {Page} from './page'
import {Comment} from './comment'
import {Author} from './author'
import {Subscription, Event, Poll, User} from '@prisma/client'

export enum ActionType {
  ArticleCreated = 'articleCreated',
  PageCreated = 'pageCreated',
  CommentCreated = 'commentCreated',
  SubscriptionCreated = 'subscriptionCreated',
  AuthorCreated = 'authorCreated',
  PollStarted = 'pollStarted',
  UserCreated = 'userCreated',
  EventCreated = 'eventCreated'
}

export interface Action {
  date: Date
  actionType: ActionType
  id: string
  item?: Article | Page | Subscription | Comment | Author | Poll | Event | User
}
