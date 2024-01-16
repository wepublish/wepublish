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
}
