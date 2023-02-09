import {Article, ArticleData} from './article'
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
  item?: ActionItem
}

interface ActionItem {
  article?: Article
  page?: Page
  comment?: Comment
  author?: Author
  poll?: Poll
  subscription?: Subscription
  event?: Event
  user?: User
}
/*
interface ArticleAction {
  article: Article
}

interface PageAction {
  page: Page
}

interface CommentAction {
  comment: Comment
}

interface AuthorAction {
  author: Author
}

interface PollAction {
  poll: Poll
}

interface SubscriptionAction {
  subscription: Subscription
}

interface EventAction {
  event: Event
}

interface UserAction {
  user: User
}
*/
