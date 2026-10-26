import {
  ArticleAccessSource,
  EngagementActionRole,
  EngagementActionType,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  FullArticleAccessFragment,
  FullEngagementActionFragment,
  FullEngagementPromptFragment,
} from '@wepublish/website/api';
import { mockRichText } from './richtext';

type Stage = FullEngagementPromptFragment['stage'];

export const mockEngagementAction = ({
  id = 'action-1',
  type = EngagementActionType.Url,
  label = 'Subscribe to our newsletter',
  url = 'https://example.com/newsletter',
  style = '',
  role = EngagementActionRole.Primary,
}: Partial<FullEngagementActionFragment> = {}): FullEngagementActionFragment => ({
  __typename: 'EngagementAction',
  id,
  type,
  label,
  url,
  style,
  role,
});

export const mockEngagementPrompt = ({
  ruleId = 'rule-1',
  ruleVersion = 1,
  goal = EngagementGoal.Newsletter,
  stage: {
    id = 'stage-1',
    afterArticles = 2,
    placement = EngagementPlacement.Modal,
    enforcement = EngagementEnforcement.Soft,
    requirement = null,
    previewBlocks = null,
    dismissible = true,
    hideForMinutes = 1440,
    delaySeconds = 0,
    title = 'Enjoying our journalism?',
    text = null,
    cta = null,
    description = mockRichText(),
    html = null,
    embedUrl = null,
    image = null,
    actions = [mockEngagementAction()],
  } = {} as Partial<Stage>,
}: Partial<
  Omit<FullEngagementPromptFragment, 'stage'> & { stage: Partial<Stage> }
> = {}): FullEngagementPromptFragment => ({
  __typename: 'EngagementPrompt',
  ruleId,
  ruleVersion,
  goal,
  stage: {
    __typename: 'EngagementStage',
    id,
    afterArticles,
    placement,
    enforcement,
    requirement,
    previewBlocks,
    dismissible,
    hideForMinutes,
    delaySeconds,
    title,
    text,
    cta,
    description,
    html,
    embedUrl,
    image,
    actions,
  },
});

export const mockHardEngagementPrompt = (
  stage: Partial<Stage> = {}
): FullEngagementPromptFragment =>
  mockEngagementPrompt({
    stage: {
      id: 'stage-hard',
      afterArticles: 4,
      placement: EngagementPlacement.Cutoff,
      enforcement: EngagementEnforcement.Hard,
      requirement: EngagementRequirement.Registration,
      previewBlocks: 3,
      dismissible: false,
      title: 'Register to keep reading',
      actions: [
        mockEngagementAction({
          id: 'register',
          type: EngagementActionType.Register,
          label: '',
          url: '',
        }),
        mockEngagementAction({
          id: 'login',
          type: EngagementActionType.Login,
          label: '',
          url: '',
          role: EngagementActionRole.Other,
        }),
      ],
      ...stage,
    },
  });

export const mockAnnouncementPrompt = (
  stage: Partial<Stage> = {}
): FullEngagementPromptFragment =>
  mockEngagementPrompt({
    ruleId: 'announcement-1',
    goal: EngagementGoal.Announcement,
    stage: {
      id: 'announcement-stage',
      afterArticles: 0,
      placement: EngagementPlacement.Banner,
      title: 'Our annual crowdfunding',
      text: 'Help us reach 1000 members.',
      description: null,
      ...stage,
    },
  });

export const mockArticleAccess = ({
  granted = true,
  source = null,
  requirement = null,
  previewBlocks = null,
  paywallId = null,
  ruleId = null,
  stageId = null,
}: Partial<FullArticleAccessFragment> = {}): FullArticleAccessFragment => ({
  __typename: 'ArticleAccess',
  granted,
  source,
  requirement,
  previewBlocks,
  paywallId,
  ruleId,
  stageId,
});

export const mockRestrictedByRule = (
  prompt = mockHardEngagementPrompt()
): FullArticleAccessFragment =>
  mockArticleAccess({
    granted: false,
    source: ArticleAccessSource.EngagementRule,
    requirement: prompt.stage.requirement,
    previewBlocks: prompt.stage.previewBlocks,
    ruleId: prompt.ruleId,
    stageId: prompt.stage.id,
  });
