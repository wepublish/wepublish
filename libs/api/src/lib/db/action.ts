export enum ActionType {
  Article = 'article',
  Page = 'page',
  Comment = 'comment',
  Subscription = 'subscription',
  Author = 'author',
  Poll = 'poll',
  User = 'user',
  Event = 'event'
}

export interface Action {
  date: Date
  actionType: ActionType
  id: string
  creator?: string
  summary?: string
}
