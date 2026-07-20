import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { formatCurrency } from '@wepublish/membership/website';
import { CrowdfundingGoalType, Currency } from '@wepublish/website/api';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';
import { ElementType } from 'react';
import { Trans } from 'react-i18next';

import { euclidCircularB } from '../theme';

// Node (SSR) and the browser emit different apostrophe glyphs for the de-CH
// grouping separator (U+2019 vs U+0027) which causes a hydration mismatch.
// Normalize to a single canonical apostrophe.
const formatNumber = (value: number, locale = 'de-CH') =>
  new Intl.NumberFormat(locale).format(value).replace(/[’ʼ]/g, "'");

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Title = styled(Typography)<{ component?: ElementType }>`
  margin: 0;
`;

const Caption = styled(Typography)<{ component?: ElementType }>`
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Bar = styled('div')`
  position: relative;
  width: 100%;
  height: ${({ theme }) => theme.spacing(5.5)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.common.white};
  overflow: hidden;
`;

const BarFill = styled('div', {
  shouldForwardProp: prop => prop !== 'progress',
})<{ progress: number }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ progress }) => Math.min(100, Math.max(0, progress))}%;
  background-color: ${({ theme }) => theme.palette.common.black};
`;

const BarLabel = styled('span')`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing(2)};
  transform: translateY(-50%);
  font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1;
  // white + difference blend => black text on the white track, white text on
  // the black fill, so the label stays readable at any progress.
  color: ${({ theme }) => theme.palette.common.white};
  mix-blend-mode: difference;
`;

export const ReflektCrowdfundingBlock = ({
  crowdfunding,
}: BuilderCrowdfundingBlockProps) => {
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

  if (!goalAmount) {
    return null;
  }

  return (
    <Wrapper>
      <Title
        variant="h4"
        component="p"
      >
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
        />
      </Title>

      {daysRemaining != null && (
        <Caption
          variant="caption"
          component="p"
        >
          <Trans
            i18nKey="crowdfunding.stats.daysRemaining"
            values={{ days: daysRemaining }}
          />
        </Caption>
      )}

      <Bar>
        <BarFill progress={progress} />
        <BarLabel>{Math.round(progress)}%</BarLabel>
      </Bar>
    </Wrapper>
  );
};
