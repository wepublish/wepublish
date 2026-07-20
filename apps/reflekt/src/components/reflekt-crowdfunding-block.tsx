import styled from '@emotion/styled';
import { css } from '@mui/material';
import { CrowdfundingBlock } from '@wepublish/block-content/website';
import { formatCurrency } from '@wepublish/membership/website';
import { CrowdfundingGoalType, Currency } from '@wepublish/website/api';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';
import { Trans } from 'react-i18next';

// Node (SSR) and the browser emit different apostrophe glyphs for the de-CH
// grouping separator (U+2019 vs U+0027) which causes a hydration mismatch.
// Normalize to a single canonical apostrophe.
const formatNumber = (value: number, locale = 'de-CH') =>
  new Intl.NumberFormat(locale).format(value).replace(/[’ʼ]/g, "'");

const CfStats = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)};
  margin: ${({ theme }) => theme.spacing(2)};
`;

const CfStat = styled('p')`
  margin: 0;
`;

const noWrap = css`
  text-wrap: nowrap;
`;

export const ReflektCrowdfundingBlock = (
  props: BuilderCrowdfundingBlockProps
) => {
  const { crowdfunding } = props;

  if (!crowdfunding) {
    return null;
  }

  const activeGoal = crowdfunding.activeGoal;
  const progress = activeGoal?.progress ?? 0;
  const revenue = crowdfunding.revenue ?? 0;
  const subscriptions = crowdfunding.subscriptions ?? 0;
  const goalAmount = activeGoal?.amount ?? 0;
  const daysRemaining = crowdfunding.daysRemaining;
  const isRevenueGoal = crowdfunding.goalType === CrowdfundingGoalType.Revenue;

  return (
    <>
      <CrowdfundingBlock {...props} />

      <CfStats>
        {!!goalAmount && (
          <CfStat>
            <Trans
              i18nKey="crowdfunding.stats.progressOfGoal"
              values={{
                type: crowdfunding.goalType,
                current:
                  isRevenueGoal ?
                    formatCurrency(revenue / 100, Currency.Chf)
                  : formatNumber(subscriptions),
                goal:
                  isRevenueGoal ?
                    formatCurrency(goalAmount / 100, Currency.Chf)
                  : formatNumber(goalAmount),
              }}
              components={{ bold: <strong css={noWrap} /> }}
            />
          </CfStat>
        )}

        {!!goalAmount && (
          <CfStat>
            <Trans
              i18nKey="crowdfunding.stats.percentReached"
              values={{ percent: Math.round(progress) }}
              components={{ bold: <strong css={noWrap} /> }}
            />
          </CfStat>
        )}

        {daysRemaining != null && (
          <CfStat>
            <Trans
              i18nKey="crowdfunding.stats.daysRemaining"
              values={{ days: daysRemaining }}
              components={{ bold: <strong css={noWrap} /> }}
            />
          </CfStat>
        )}
      </CfStats>
    </>
  );
};
