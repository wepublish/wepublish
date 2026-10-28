import {
  CreateEngagementRuleInput,
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  FullEngagementRuleFragment,
  FullImageFragment,
  NewsletterReferralMode,
} from '@wepublish/editor/api';
import { RichTextBlockValue } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { z } from 'zod';

export type EngagementActionValues = {
  type: EngagementActionType;
  label: string;
  url: string;
  style: string;
  role: EngagementActionRole;
};

export type EngagementStageValues = {
  afterArticles: number;
  placement: EngagementPlacement;
  enforcement: EngagementEnforcement;
  requirement: EngagementRequirement | null;
  previewBlocks: number | null;
  dismissible: boolean;
  hideForMinutes: number;
  delaySeconds: number;
  title: string | null;
  text: string | null;
  cta: string | null;
  description?: RichTextBlockValue['richText'] | null;
  html: string | null;
  embedUrl: string | null;
  imageId: string | null;
  image: FullImageFragment | null;
  actions: EngagementActionValues[];
};

export type EngagementRuleValues = {
  name: string;
  goal: EngagementGoal;
  active: boolean;
  priority: number;
  audience: EngagementAudience;
  /** Only saved for the member plans audience. */
  audienceMemberPlanIds: string[];
  showOnArticles: boolean;
  showOnPageIds: string[];
  includePeeredArticles: boolean;
  meterWindowDays: number | null;
  newsletterReferral: NewsletterReferralMode;
  newsletterReferralLimit: number;
  newsletterParams: Array<{ key: string; value: string }>;
  stages: EngagementStageValues[];
};

export const actionDefaults = (
  action: Partial<EngagementActionValues> = {}
): EngagementActionValues => ({
  type: EngagementActionType.Url,
  label: '',
  url: '',
  style: '',
  role: EngagementActionRole.Primary,
  ...action,
});

export const stageDefaults = (
  stage: Partial<EngagementStageValues> = {}
): EngagementStageValues => ({
  afterArticles: 0,
  placement: EngagementPlacement.Modal,
  enforcement: EngagementEnforcement.Soft,
  requirement: null,
  previewBlocks: null,
  dismissible: true,
  hideForMinutes: 1440,
  delaySeconds: 0,
  title: null,
  text: null,
  cta: null,
  description: null,
  html: null,
  embedUrl: null,
  imageId: null,
  image: null,
  actions: [],
  ...stage,
});

/** A hard stage is the cutoff that keeps the rest of the article back. */
export const hardStage = (
  stage: Partial<EngagementStageValues> = {}
): EngagementStageValues =>
  stageDefaults({
    placement: EngagementPlacement.Cutoff,
    enforcement: EngagementEnforcement.Hard,
    requirement: EngagementRequirement.Registration,
    previewBlocks: 3,
    dismissible: false,
    ...stage,
  });

export const isHard = (stage: Pick<EngagementStageValues, 'enforcement'>) =>
  stage.enforcement === EngagementEnforcement.Hard;

/**
 * The priority of a rule that is shown before the rules it competes with.
 * Without it the more specific rule goes first, then the newest.
 */
export const SHOW_FIRST_PRIORITY = 10;

export const showsFirst = (priority: number) => priority > 0;

export const isAnnouncement = (rule: Pick<EngagementRuleValues, 'goal'>) =>
  rule.goal === EngagementGoal.Announcement;

const ACTIONS_WITH_URL = [
  EngagementActionType.Url,
  EngagementActionType.Newsletter,
];

export const actionNeedsUrl = (type: EngagementActionType) =>
  ACTIONS_WITH_URL.includes(type);

export type EngagementRuleProblem = { path: string; code: string };

/**
 * The same rules as `validateEngagementRule` in `engagement-api`, with the
 * same codes: the server refuses what this lets through.
 */
export function engagementRuleProblems(
  rule: EngagementRuleValues
): EngagementRuleProblem[] {
  const problems: EngagementRuleProblem[] = [];
  const problem = (path: string, code: string) => problems.push({ path, code });
  const announcement = isAnnouncement(rule);

  if (!rule.stages.length) {
    problem('stages', 'required');
  }

  if (announcement && rule.stages.length > 1) {
    problem('stages', 'announcementSingleStage');
  }

  rule.stages.forEach((stage, index) => {
    const path = `stages.${index}`;
    const previous = rule.stages[index - 1];

    if (stage.afterArticles < 0) {
      problem(`${path}.afterArticles`, 'min');
    } else if (previous && stage.afterArticles <= previous.afterArticles) {
      problem(`${path}.afterArticles`, 'ascending');
    }

    if (announcement && stage.afterArticles !== 0) {
      problem(`${path}.afterArticles`, 'announcementFromStart');
    }

    if (isHard(stage)) {
      if (announcement) {
        problem(`${path}.enforcement`, 'announcementSoft');
      } else if (index !== rule.stages.length - 1) {
        problem(`${path}.enforcement`, 'hardNotLast');
      }

      if (stage.placement !== EngagementPlacement.Cutoff) {
        problem(`${path}.placement`, 'hardNeedsCutoff');
      }

      if (!stage.requirement) {
        problem(`${path}.requirement`, 'required');
      }

      if (stage.previewBlocks == null) {
        problem(`${path}.previewBlocks`, 'required');
      } else if (stage.previewBlocks < 0) {
        problem(`${path}.previewBlocks`, 'min');
      }

      if (
        rule.goal === EngagementGoal.Newsletter &&
        !stage.actions.some(
          action => action.type === EngagementActionType.Newsletter
        )
      ) {
        problem(`${path}.actions`, 'newsletterActionRequired');
      }
    } else {
      if (stage.requirement) {
        problem(`${path}.requirement`, 'onlyHard');
      }

      if (stage.previewBlocks != null) {
        problem(`${path}.previewBlocks`, 'onlyHard');
      }
    }

    stage.actions.forEach((action, actionIndex) => {
      if (actionNeedsUrl(action.type) && !action.url.trim()) {
        problem(`${path}.actions.${actionIndex}.url`, 'required');
      }
    });
  });

  if (announcement) {
    if (rule.meterWindowDays != null) {
      problem('meterWindowDays', 'announcementNoMeter');
    }

    if (rule.newsletterReferral !== NewsletterReferralMode.None) {
      problem('newsletterReferral', 'announcementNoReferral');
    }
  } else if (rule.meterWindowDays == null) {
    problem('meterWindowDays', 'required');
  } else if (rule.meterWindowDays < 1) {
    problem('meterWindowDays', 'min');
  }

  if (
    rule.newsletterReferral === NewsletterReferralMode.Limited &&
    rule.newsletterReferralLimit < 1
  ) {
    problem('newsletterReferralLimit', 'min');
  }

  if (
    rule.audience === EngagementAudience.MemberPlans &&
    !rule.audienceMemberPlanIds.length
  ) {
    problem('audienceMemberPlanIds', 'required');
  }

  return problems;
}

const actionSchema = z.object({
  type: z.nativeEnum(EngagementActionType),
  label: z.string(),
  url: z.string(),
  style: z.string(),
  role: z.nativeEnum(EngagementActionRole),
});

const stageSchema = z.object({
  afterArticles: z.number().int(),
  placement: z.nativeEnum(EngagementPlacement),
  enforcement: z.nativeEnum(EngagementEnforcement),
  requirement: z.nativeEnum(EngagementRequirement).nullable(),
  previewBlocks: z.number().int().nullable(),
  dismissible: z.boolean(),
  hideForMinutes: z.number().int().min(0),
  delaySeconds: z.number().int().min(0),
  title: z.string().nullable(),
  text: z.string().nullable(),
  cta: z.string().nullable(),
  description: z.custom<RichTextBlockValue['richText']>().nullable(),
  html: z.string().nullable(),
  embedUrl: z.string().nullable(),
  imageId: z.string().nullable(),
  image: z.custom<FullImageFragment>().nullable(),
  actions: z.array(actionSchema),
});

export const createEngagementRuleSchema = (
  t: TFunction
): z.ZodType<EngagementRuleValues> =>
  z
    .object({
      name: z.string().min(1, t('errorMessages.required')),
      goal: z.nativeEnum(EngagementGoal),
      active: z.boolean(),
      priority: z.number().int(),
      audience: z.nativeEnum(EngagementAudience),
      audienceMemberPlanIds: z.array(z.string()),
      showOnArticles: z.boolean(),
      showOnPageIds: z.array(z.string()),
      includePeeredArticles: z.boolean(),
      meterWindowDays: z.number().int().nullable(),
      newsletterReferral: z.nativeEnum(NewsletterReferralMode),
      newsletterReferralLimit: z.number().int(),
      newsletterParams: z.array(
        z.object({ key: z.string(), value: z.string() })
      ),
      stages: z.array(stageSchema),
    })
    .superRefine((rule, context) => {
      for (const { path, code } of engagementRuleProblems(rule)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: path
            .split('.')
            .map(part => (/^\d+$/.test(part) ? +part : part)),
          message: t(`engagement.validation.${code}`),
        });
      }
    });

export const toEngagementRuleInput = ({
  stages,
  newsletterParams,
  audienceMemberPlanIds,
  ...rule
}: EngagementRuleValues): CreateEngagementRuleInput => ({
  ...rule,
  audienceMemberPlanIds:
    rule.audience === EngagementAudience.MemberPlans ?
      audienceMemberPlanIds
    : [],
  newsletterParams: newsletterParams.filter(({ key }) => key.trim()),
  stages: stages.map(({ image: _image, actions, ...stage }) => ({
    ...stage,
    actions: actions.map(action => ({ ...action })),
  })),
});

export const engagementRuleToValues = ({
  name,
  goal,
  active,
  priority,
  audience,
  audienceMemberPlanIds,
  showOnArticles,
  showOnPageIds,
  includePeeredArticles,
  meterWindowDays,
  newsletterReferral,
  newsletterReferralLimit,
  newsletterParams,
  stages,
}: FullEngagementRuleFragment): EngagementRuleValues => ({
  name,
  goal,
  active,
  priority,
  audience,
  audienceMemberPlanIds,
  showOnArticles,
  showOnPageIds,
  includePeeredArticles,
  meterWindowDays,
  newsletterReferral,
  newsletterReferralLimit,
  newsletterParams: newsletterParams.map(({ key, value }) => ({ key, value })),
  stages: stages.map(({ id: _id, __typename, actions, image, ...stage }) => ({
    ...stage,
    image: image ?? null,
    actions: actions.map(({ type, label, url, style, role }) => ({
      type,
      label,
      url,
      style,
      role,
    })),
  })),
});

/**
 * A new, unsaved rule with the values of another one. It starts inactive, so
 * it does not show next to the original before it was adjusted.
 */
export const copyEngagementRule = (
  rule: FullEngagementRuleFragment,
  t: TFunction
): EngagementRuleValues => ({
  ...engagementRuleToValues(rule),
  name: t('engagement.copyName', { name: rule.name }),
  active: false,
});
