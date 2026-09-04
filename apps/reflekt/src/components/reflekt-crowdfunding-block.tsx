import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { formatCurrency } from '@wepublish/membership/website';
import { CrowdfundingGoalType, Currency } from '@wepublish/website/api';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';
import { ElementType, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

import theme, { euclidCircularB, robotoMono } from '../theme';
import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';

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
  height: ${theme.spacing(5.5)};
  margin-top: ${theme.spacing(1)};
  background-color: ${theme.palette.common.white};
  overflow: hidden;
`;

const HeroBar = styled(Bar)`
  height: ${theme.spacing(4)};
`;

const BarFill = styled('div', {
  shouldForwardProp: prop => prop !== 'progress',
})<{ progress: number }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ progress }) => Math.min(100, Math.max(0, progress))}%;
  background-color: ${theme.palette.common.black};
`;

const HeroBarFill = styled(BarFill)`
  background-color: ${theme.palette.secondary.light};
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

const HeroBarTitle = styled('span')`
  position: absolute;
  top: 50%;
  left: ${({ theme }) => theme.spacing(2)};
  transform: translateY(-50%);
  font-family: ${[robotoMono.style.fontFamily, 'monospace'].join(',')};
  font-weight: 700;
  font-size: 0.75rem;
  line-height: 1;
  color: ${({ theme }) => theme.palette.common.black};

  ${theme.breakpoints.up('md')} {
    font-size: 0.875rem;
  }
`;

const HeroDays = styled(Typography)<{ component?: ElementType }>`
  text-align: right;
  font-family: ${[robotoMono.style.fontFamily, 'monospace'].join(',')};
  color: ${({ theme }) => theme.palette.common.white};
`;

export const ReflektCrowdfundingBlock = ({
  crowdfunding,
  blockStyle,
}: BuilderCrowdfundingBlockProps) => {
  const countSubscriptionsUntil = crowdfunding?.countSubscriptionsUntil;
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!countSubscriptionsUntil) {
      setDaysRemaining(null);
      return;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const remaining = Math.ceil(
      (new Date(countSubscriptionsUntil).getTime() - Date.now()) /
        millisecondsPerDay
    );
    setDaysRemaining(Math.max(0, remaining));
  }, [countSubscriptionsUntil]);

  if (!crowdfunding) {
    return null;
  }

  const activeGoal = crowdfunding.activeGoal;
  const progress = activeGoal?.progress ?? 0;
  const revenue = crowdfunding.revenue ?? 0;
  const subscriptions = crowdfunding.subscriptions ?? 0;
  const goalAmount = activeGoal?.amount ?? 0;
  const isRevenueGoal = crowdfunding.goalType === CrowdfundingGoalType.Revenue;

  if (!goalAmount) {
    return null;
  }

  const isHero = blockStyle === ReflektBlockStyles.CrowdfundingHero;

  const titleContent = (
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
  );

  const daysContent =
    daysRemaining != null ?
      <Trans
        i18nKey="crowdfunding.stats.daysRemaining"
        values={{ days: daysRemaining }}
      />
    : null;

  if (isHero) {
    return (
      <Wrapper>
        <HeroBar>
          <HeroBarFill progress={progress} />
          <HeroBarTitle>{titleContent}</HeroBarTitle>
        </HeroBar>

        {daysContent && (
          <HeroDays
            variant="caption"
            component="p"
          >
            {daysContent}
          </HeroDays>
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title
        variant="h4"
        component="p"
      >
        {titleContent}
      </Title>

      {daysContent && (
        <Caption
          variant="caption"
          component="p"
        >
          {daysContent}
        </Caption>
      )}

      <Bar>
        <BarFill progress={progress} />
        <BarLabel>{Math.round(progress)}%</BarLabel>
      </Bar>
    </Wrapper>
  );
};
