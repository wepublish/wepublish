import { Box, LinearProgress, Typography } from '@mui/material';
import {
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

function formatMoney(amount: number): string {
  return Math.round(amount / 100).toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CrowdfundingProgressBar({
  crowdfunding,
}: {
  crowdfunding: Partial<FullCrowdfundingFragment>;
}) {
  const { t } = useTranslation();
  const progress = Math.round(crowdfunding.activeGoal?.progress || 0);
  const headingId = useId();

  return (
    <>
      <Typography
        variant="h3"
        component="p"
        id={headingId}
      >
        {crowdfunding.goalType === CrowdfundingGoalType.Revenue ?
          t('crowdfunding.form.revenue', {
            revenue: formatMoney(crowdfunding.revenue || 0),
          })
        : t('crowdfunding.form.subscriptions', {
            subscriptions: crowdfunding.subscriptions ?? 0,
          })
        }
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
          aria-labelledby={headingId}
          aria-valuetext={`${progress}%`}
          sx={{ flex: 1 }}
        />

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {progress}%
        </Typography>
      </Box>
    </>
  );
}
