import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { EngagementGoal } from '@wepublish/editor/api';
import { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlinePlace, MdPeopleOutline } from 'react-icons/md';
import { EngagementConflictNotice } from './engagement-conflict-notice';
import { EngagementConflict } from './engagement-conflicts';
import { RuleColumns, RuleContainer } from './engagement-layout';
import { PresetIllustration } from './engagement-preset-cards';
import {
  EngagementRuleValues,
  EngagementStageValues,
} from './engagement-rule-values';
import { summarizeStages, summarizeWhere } from './summarize-rule';

const GOAL_COLOR: Record<EngagementGoal, 'info' | 'success' | 'secondary'> = {
  [EngagementGoal.Newsletter]: 'info',
  [EngagementGoal.Membership]: 'success',
  [EngagementGoal.Announcement]: 'secondary',
};

const Fact = ({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType;
  label: string;
  children: ReactNode;
}) => (
  <Stack
    direction="row"
    sx={{ gap: 1, alignItems: 'flex-start', minWidth: 0 }}
  >
    <Box
      sx={{ color: 'text.secondary', fontSize: 20, lineHeight: 0, pt: '2px' }}
    >
      <Icon />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
      >
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Box>
  </Stack>
);

/**
 * Roughly what readers get: the title, the text and the buttons. The website
 * decides the actual look.
 */
const PromptPreview = ({
  stage,
  accent,
}: {
  stage: EngagementStageValues;
  accent: string;
}) => {
  const { t } = useTranslation();
  const title = stage.title || t('engagement.review.untitled');

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: `1px solid ${alpha(accent, 0.4)}`,
        bgcolor: alpha(accent, 0.06),
        minWidth: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontStyle: stage.title ? undefined : 'italic' }}
      >
        {title}
      </Typography>

      {stage.text && <Typography variant="body2">{stage.text}</Typography>}
      {stage.cta && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {stage.cta}
        </Typography>
      )}

      {stage.actions.length > 0 && (
        <Stack
          direction="row"
          sx={{ gap: 1, flexWrap: 'wrap', mt: 1 }}
        >
          {stage.actions.map((action, index) => (
            <Chip
              key={index}
              size="small"
              label={action.label || t(`engagement.actionType.${action.type}`)}
              variant={index === 0 ? 'filled' : 'outlined'}
              sx={index === 0 ? { bgcolor: accent, color: 'common.white' } : {}}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

type EngagementRuleOverviewProps = {
  rule: EngagementRuleValues;
  conflicts?: EngagementConflict[];
  /** E.g. back to editing, or creating the rule. */
  actions?: ReactNode;
};

/**
 * What a rule will do, step by step: hard to imagine from the form when
 * setting one up for the first time. Its own view next to the form, with room
 * for the previews.
 */
export const EngagementRuleOverview = ({
  rule,
  conflicts = [],
  actions,
}: EngagementRuleOverviewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const accent = theme.palette[GOAL_COLOR[rule.goal]].main;
  const steps = summarizeStages(rule, t);
  const where = summarizeWhere(rule, t);

  return (
    <RuleContainer
      as="section"
      aria-labelledby="rule-review-title"
      data-testid="rule-review"
    >
      <RuleColumns>
        <Card
          variant="outlined"
          data-testid="overview-rule"
        >
          <CardContent>
            <Stack sx={{ gap: 3 }}>
              <Typography
                id="rule-review-title"
                variant="h3"
                component="h2"
              >
                {t('engagement.review.title')}
              </Typography>

              <Stack sx={{ gap: 1 }}>
                <Stack
                  direction="row"
                  sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Typography variant="h5">{rule.name}</Typography>
                  <Chip
                    size="small"
                    label={t(`engagement.goal.${rule.goal}`)}
                    sx={{ bgcolor: alpha(accent, 0.16) }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color={rule.active ? 'success.main' : 'text.secondary'}
                >
                  {rule.active ?
                    t('engagement.review.goesLive')
                  : t('engagement.review.inactive')}
                </Typography>
              </Stack>

              <Fact
                icon={MdPeopleOutline}
                label={t('engagement.review.who')}
              >
                {t(`engagement.audience.${rule.audience}`)}
              </Fact>
              <Fact
                icon={MdOutlinePlace}
                label={t('engagement.review.where')}
              >
                {where || t('engagement.review.nowhere')}
              </Fact>

              <EngagementConflictNotice conflicts={conflicts} />

              {actions && (
                <Stack
                  direction="row"
                  sx={{ gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}
                >
                  {actions}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Stack
          spacing={2}
          useFlexGap
          data-testid="overview-steps"
        >
          <Typography variant="h3">{t('engagement.review.steps')}</Typography>

          {rule.stages.map((stage, index) => (
            <Card
              key={index}
              variant="outlined"
              data-testid="overview-step"
            >
              <CardContent
                sx={{
                  display: 'grid',
                  gap: 3,
                  alignItems: 'center',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  [theme.breakpoints.up('md')]: {
                    gridTemplateColumns: '220px minmax(0, 1fr)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(accent, 0.08),
                  }}
                >
                  <PresetIllustration
                    placement={stage.placement}
                    accent={accent}
                  />
                </Box>

                <Stack sx={{ gap: 1.5, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    sx={{ gap: 1, alignItems: 'center' }}
                  >
                    {rule.stages.length > 1 && (
                      <Chip
                        size="small"
                        label={t('engagement.form.stage', {
                          number: index + 1,
                        })}
                      />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        '&::first-letter': { textTransform: 'uppercase' },
                      }}
                    >
                      {steps[index]}
                    </Typography>
                  </Stack>

                  <PromptPreview
                    stage={stage}
                    accent={accent}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </RuleColumns>
    </RuleContainer>
  );
};
