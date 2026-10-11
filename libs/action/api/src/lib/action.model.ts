import {
  createUnionType,
  Field,
  InterfaceType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  HasSubscriptionLc,
  PublicSubscription,
} from '@wepublish/membership/api';
import { Article, HasArticleLc } from '@wepublish/article/api';
import { Author, HasAuthor } from '@wepublish/author/api';
import { Comment, HasComment } from '@wepublish/comments/api';
import { Event, HasEventLc } from '@wepublish/event/api';
import { HasPageLc, Page } from '@wepublish/page/api';
import { FullPoll, HasPoll } from '@wepublish/poll/api';
import { HasUserLc, User } from '@wepublish/user/api';

export enum ActionType {
  ArticleCreated = 'articleCreated',
  PageCreated = 'pageCreated',
  CommentCreated = 'commentCreated',
  SubscriptionCreated = 'subscriptionCreated',
  AuthorCreated = 'authorCreated',
  PollStarted = 'pollStarted',
  UserCreated = 'userCreated',
  EventCreated = 'eventCreated',
}

registerEnumType(ActionType, { name: 'ActionType' });

@InterfaceType()
export class BaseAction<AT extends ActionType> {
  @Field(() => ActionType)
  actionType!: AT;

  @Field(() => Date)
  date!: Date;
}

@ObjectType({ implements: () => [BaseAction, HasArticleLc] })
export class ArticleCreatedAction
  extends BaseAction<ActionType.ArticleCreated>
  implements HasArticleLc
{
  articleId!: string;
  article!: Article;
}

@ObjectType({ implements: () => [BaseAction, HasPageLc] })
export class PageCreatedAction
  extends BaseAction<ActionType.PageCreated>
  implements HasPageLc
{
  pageId!: string;
  page!: Page;
}

@ObjectType({ implements: () => [BaseAction, HasComment] })
export class CommentCreatedAction
  extends BaseAction<ActionType.CommentCreated>
  implements HasComment
{
  commentId!: string;
  comment!: Comment;
}

@ObjectType({ implements: () => [BaseAction, HasPoll] })
export class PollStartedAction
  extends BaseAction<ActionType.PollStarted>
  implements HasPoll
{
  pollId!: string;
  poll!: FullPoll;
}

@ObjectType({ implements: () => [BaseAction, HasSubscriptionLc] })
export class SubscriptionCreatedAction
  extends BaseAction<ActionType.SubscriptionCreated>
  implements HasSubscriptionLc
{
  subscriptionId!: string;
  subscription!: PublicSubscription;
}

@ObjectType({ implements: () => [BaseAction, HasAuthor] })
export class AuthorCreatedAction
  extends BaseAction<ActionType.AuthorCreated>
  implements HasAuthor
{
  authorId!: string;
  author!: Author;
}

@ObjectType({ implements: () => [BaseAction, HasUserLc] })
export class UserCreatedAction
  extends BaseAction<ActionType.UserCreated>
  implements HasUserLc
{
  userId!: string;
  user!: User;
}

@ObjectType({ implements: () => [BaseAction, HasEventLc] })
export class EventCreatedAction
  extends BaseAction<ActionType.EventCreated>
  implements HasEventLc
{
  eventId!: string;
  event!: Event;
}

export const Action = createUnionType({
  name: 'Action',
  types: () =>
    [
      ArticleCreatedAction,
      PageCreatedAction,
      CommentCreatedAction,
      PollStartedAction,
      SubscriptionCreatedAction,
      AuthorCreatedAction,
      UserCreatedAction,
      EventCreatedAction,
    ] as const,
  resolveType: (value: BaseAction<ActionType>) => {
    switch (value.actionType) {
      case ActionType.ArticleCreated:
        return ArticleCreatedAction.name;
      case ActionType.PageCreated:
        return PageCreatedAction.name;
      case ActionType.CommentCreated:
        return CommentCreatedAction.name;
      case ActionType.PollStarted:
        return PollStartedAction.name;
      case ActionType.SubscriptionCreated:
        return SubscriptionCreatedAction.name;
      case ActionType.AuthorCreated:
        return AuthorCreatedAction.name;
      case ActionType.UserCreated:
        return UserCreatedAction.name;
      case ActionType.EventCreated:
        return EventCreatedAction.name;
    }

    throw new Error(`Action ${value.actionType} not implemented!`);
  },
});
