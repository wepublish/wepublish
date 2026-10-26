import {
  BannerActionRole,
  EngagementActionRole,
  FullBannerFragment,
  FullEngagementPromptFragment,
} from '@wepublish/website/api';
import { TFunction } from 'i18next';
import { actionHref, actionLabel } from './engagement-action';

const ROLE: Record<EngagementActionRole, BannerActionRole> = {
  [EngagementActionRole.Primary]: BannerActionRole.Primary,
  [EngagementActionRole.Cancel]: BannerActionRole.Cancel,
  [EngagementActionRole.Other]: BannerActionRole.Other,
};

/** Banner prompts show in the `Banner` builder component, overrides included. */
export const promptToBanner = (
  { ruleId, stage }: FullEngagementPromptFragment,
  t: TFunction
): FullBannerFragment => ({
  __typename: 'Banner',
  id: ruleId,
  title: stage.title ?? '',
  text: stage.text ?? '',
  cta: stage.cta,
  collapsible: stage.dismissible,
  html: stage.html,
  embedUrl: stage.embedUrl,
  delay: stage.delaySeconds,
  hideForMinutes: stage.hideForMinutes,
  showOnArticles: true,
  showOnPages: [],
  image: stage.image,
  actions: stage.actions.map(action => ({
    __typename: 'BannerAction',
    id: action.id,
    label: actionLabel(action, t),
    url: actionHref(action),
    style: action.style,
    role: ROLE[action.role],
  })),
});
