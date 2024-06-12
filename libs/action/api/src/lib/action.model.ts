import {Field, ObjectType, registerEnumType, createUnionType} from '@nestjs/graphql'
import {ID} from '@nestjs/graphql'
import {AuthorV2 as Author} from '@wepublish/author/api'
import {Event} from '@wepublish/event/api'

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

registerEnumType(ActionType, {name: 'ActionType'})

@ObjectType()
export class AbstractAction {
  @Field(() => ID)
  id!: string

  @Field(() => ActionType)
  actionType!: ActionType

  @Field(() => Date)
  date!: Date
}

@ObjectType()
export class ArticleCreatedAction extends AbstractAction {
  // @Field(() => Article)
  // article!: Article;
}

@ObjectType()
export class PageCreatedAction extends AbstractAction {
  // @Field(() => Page)
  // page!: Page;
}

@ObjectType()
export class CommentCreatedAction extends AbstractAction {
  // @Field(() => Comment)
  // comment!: Comment;
}

@ObjectType()
export class PollStartedAction extends AbstractAction {
  // @Field(() => Poll)
  // poll!: Poll;
}

@ObjectType()
export class SubscriptionCreatedAction extends AbstractAction {
  // @Field(() => Subscription)
  // subscription!: Subscription;
}

@ObjectType()
export class AuthorCreatedAction extends AbstractAction {
  @Field(() => Author)
  author!: Author
}

@ObjectType()
export class UserCreatedAction extends AbstractAction {
  // @Field(() => User)
  // user!: User;
}

@ObjectType()
export class EventCreatedAction extends AbstractAction {
  @Field(() => Event)
  event!: Event
}

export const Action = createUnionType({
  name: 'Action',
  types: () => [
    ArticleCreatedAction,
    PageCreatedAction,
    CommentCreatedAction,
    PollStartedAction,
    SubscriptionCreatedAction,
    AuthorCreatedAction,
    UserCreatedAction,
    EventCreatedAction
  ],
  resolveType: (value: AbstractAction) => {
    switch (value.actionType) {
      case ActionType.ArticleCreated:
        return ArticleCreatedAction.name
      case ActionType.PageCreated:
        return PageCreatedAction.name
      case ActionType.CommentCreated:
        return CommentCreatedAction.name
      case ActionType.PollStarted:
        return PollStartedAction.name
      case ActionType.SubscriptionCreated:
        return SubscriptionCreatedAction.name
      case ActionType.AuthorCreated:
        return AuthorCreatedAction.name
      case ActionType.UserCreated:
        return UserCreatedAction.name
      case ActionType.EventCreated:
        return EventCreatedAction.name
    }
    throw new Error('Invalid data')
  }
})
