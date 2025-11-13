import { FullCrowdfundingFragment } from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Progress } from 'rsuite';

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
  const progress = crowdfunding.activeGoal?.progress || 0;

  return (
    <>
      <h3>
        {t('crowdfunding.form.revenue', {
          revenue: formatMoney(crowdfunding.revenue || 0),
        })}
      </h3>

      <Progress.Line
        style={{ marginLeft: 0 }}
        percent={progress}
      />
    </>
  );
}
