export enum ActionType {
  ArticleCreated = 'ArticleCreatedAction',
  PageCreated = 'PageCreatedAction',
  CommentCreated = 'CommentCreatedAction',
  SubscriptionCreated = 'SubscriptionCreatedAction',
  AuthorCreated = 'AuthorCreatedAction',
  PollStarted = 'PollStartedAction',
  UserCreated = 'UserCreatedAction',
  EventCreated = 'EventCreatedAction'
}

export interface Action {
  date: Date
  actionType: ActionType
  id: string
}
