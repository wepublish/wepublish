import {
  EngagementActionType,
  FullEngagementActionFragment,
} from '@wepublish/website/api';
import { TFunction } from 'i18next';

/** Where an action leads. Login, signup and membership have their pages. */
export const actionHref = ({
  type,
  url,
}: Pick<FullEngagementActionFragment, 'type' | 'url'>) => {
  switch (type) {
    case EngagementActionType.Login:
      return '/login';
    case EngagementActionType.Register:
      return '/signup';
    case EngagementActionType.Membership:
      return url || '/mitmachen';
    default:
      return url;
  }
};

/** An empty label shows the website's default for the type. */
export const actionLabel = (
  { type, label }: Pick<FullEngagementActionFragment, 'type' | 'label'>,
  t: TFunction
) => label || t(`engagement.action.${type}`);

/** Actions that lead to a login keep the article to come back to. */
export const returnsToArticle = ({
  type,
}: Pick<FullEngagementActionFragment, 'type'>) =>
  type !== EngagementActionType.Url && type !== EngagementActionType.Newsletter;
