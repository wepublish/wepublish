import { Box, LinearProgress, Typography } from '@mui/material';
import {
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
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

  return (
    <>
      <h3>
        {crowdfunding.goalType === CrowdfundingGoalType.Revenue ?
          t('crowdfunding.form.revenue', {
            revenue: formatMoney(crowdfunding.revenue || 0),
          })
        : t('crowdfunding.form.subscriptions', {
            subscriptions: crowdfunding.subscriptions ?? 0,
          })
        }
      </h3>

      {/* MUI's LinearProgress draws only the bar, so the percentage that
          rsuite's Progress.Line printed is rendered alongside it. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
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
