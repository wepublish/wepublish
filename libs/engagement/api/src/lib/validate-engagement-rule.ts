import {
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@prisma/client';

export type EngagementStageDraft = {
  afterArticles: number;
  placement: EngagementPlacement;
  enforcement: EngagementEnforcement;
  requirement?: EngagementRequirement | null;
  previewBlocks?: number | null;
  actions: Array<{ type: EngagementActionType; url?: string | null }>;
};

export type EngagementRuleDraft = {
  goal: EngagementGoal;
  audience?: EngagementAudience;
  audienceMemberPlanIds?: string[];
  meterWindowDays?: number | null;
  stages: EngagementStageDraft[];
};

/**
 * `path` points at the field (`stages.1.placement`), `code` says what is wrong.
 * The editor's form schema mirrors these rules and codes.
 */
export type EngagementRuleProblem = { path: string; code: string };

const ACTIONS_WITH_URL: EngagementActionType[] = [
  EngagementActionType.URL,
  EngagementActionType.NEWSLETTER,
];

export function validateEngagementRule(
  rule: EngagementRuleDraft
): EngagementRuleProblem[] {
  const problems: EngagementRuleProblem[] = [];
  const problem = (path: string, code: string) => problems.push({ path, code });
  const isAnnouncement = rule.goal === EngagementGoal.ANNOUNCEMENT;

  if (!rule.stages.length) {
    problem('stages', 'required');
  }

  if (isAnnouncement && rule.stages.length > 1) {
    problem('stages', 'announcementSingleStage');
  }

  rule.stages.forEach((stage, index) => {
    const path = `stages.${index}`;
    const isHard = stage.enforcement === EngagementEnforcement.HARD;
    const previous = rule.stages[index - 1];

    if (stage.afterArticles < 0) {
      problem(`${path}.afterArticles`, 'min');
    } else if (previous && stage.afterArticles <= previous.afterArticles) {
      problem(`${path}.afterArticles`, 'ascending');
    }

    if (isAnnouncement && stage.afterArticles !== 0) {
      problem(`${path}.afterArticles`, 'announcementFromStart');
    }

    if (isHard) {
      if (isAnnouncement) {
        problem(`${path}.enforcement`, 'announcementSoft');
      } else if (index !== rule.stages.length - 1) {
        problem(`${path}.enforcement`, 'hardNotLast');
      }

      if (stage.placement !== EngagementPlacement.CUTOFF) {
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

      // Only signing up gets a reader past a newsletter rule's wall.
      if (
        rule.goal === EngagementGoal.NEWSLETTER &&
        stage.requirement &&
        stage.requirement !== EngagementRequirement.NEWSLETTER
      ) {
        problem(`${path}.requirement`, 'newsletterWallRequired');
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
      if (ACTIONS_WITH_URL.includes(action.type) && !action.url?.trim()) {
        problem(`${path}.actions.${actionIndex}.url`, 'required');
      }
    });
  });

  if (isAnnouncement) {
    if (rule.meterWindowDays != null) {
      problem('meterWindowDays', 'announcementNoMeter');
    }
  } else if (rule.meterWindowDays == null) {
    problem('meterWindowDays', 'required');
  } else if (rule.meterWindowDays < 1) {
    problem('meterWindowDays', 'min');
  }

  const memberPlans = rule.audienceMemberPlanIds ?? [];

  if (rule.audience === EngagementAudience.MEMBER_PLANS) {
    if (!memberPlans.length) {
      problem('audienceMemberPlanIds', 'required');
    }
  } else if (memberPlans.length) {
    problem('audienceMemberPlanIds', 'onlyMemberPlans');
  }

  return problems;
}
