import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { EngagementGoal } from '@wepublish/editor/api';
import { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlinePlace, MdPeopleOutline } from 'react-icons/md';
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

type EngagementRuleReviewProps = {
  rule?: EngagementRuleValues;
  saving?: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

/**
 * What a new rule will do, step by step, before it is saved: hard to imagine
 * from the form when setting one up for the first time.
 */
export const EngagementRuleReview = ({
  rule,
  saving,
  onBack,
  onConfirm,
}: EngagementRuleReviewProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!rule) {
    return null;
  }

  const accent = theme.palette[GOAL_COLOR[rule.goal]].main;
  const steps = summarizeStages(rule, t);
  const where = summarizeWhere(rule, t);

  return (
    <Dialog
      open
      onClose={onBack}
      maxWidth="md"
      fullWidth
      aria-labelledby="rule-review-title"
    >
      <DialogTitle id="rule-review-title">
        {t('engagement.review.title')}
      </DialogTitle>

      <DialogContent data-testid="rule-review">
        <Stack sx={{ gap: 3 }}>
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

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
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
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1.5 }}
            >
              {t('engagement.review.steps')}
            </Typography>

            <Box
              component="ol"
              sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 2 }}
            >
              {rule.stages.map((stage, index) => (
                <Box
                  component="li"
                  key={index}
                  sx={{
                    display: 'grid',
                    gap: 2,
                    alignItems: 'start',
                    gridTemplateColumns: '1fr',
                    [theme.breakpoints.up('sm')]: {
                      gridTemplateColumns: '160px minmax(0, 1fr)',
                    },
                  }}
                >
                  <PresetIllustration
                    placement={stage.placement}
                    accent={accent}
                  />

                  <Stack sx={{ gap: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        '&::first-letter': { textTransform: 'uppercase' },
                      }}
                    >
                      {steps[index]}
                    </Typography>

                    <PromptPreview
                      stage={stage}
                      accent={accent}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onBack}
        >
          {t('engagement.review.back')}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={saving}
        >
          {t('engagement.review.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
