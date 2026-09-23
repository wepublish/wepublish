import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { formatCurrency } from '@wepublish/membership/website';
import { CrowdfundingGoalType, Currency } from '@wepublish/website/api';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';
import { ElementType } from 'react';
import { Trans } from 'react-i18next';

import theme, { euclidCircularB, robotoMono } from '../theme';
import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';

// Node (SSR) and the browser emit different apostrophe glyphs for the de-CH
// grouping separator (U+2019 vs U+0027) which causes a hydration mismatch.
// Normalize to a single canonical apostrophe.
const formatNumber = (value: number, locale = 'de-CH') =>
  new Intl.NumberFormat(locale).format(value).replace(/[’ʼ]/g, "'");

const HERO_CURRENT_GOAL_FILL = '#E8382E';

const getDaysRemaining = (countSubscriptionsUntil?: string | null) => {
  if (!countSubscriptionsUntil) {
    return null;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const remaining = Math.ceil(
    (new Date(countSubscriptionsUntil).getTime() - Date.now()) /
      millisecondsPerDay
  );

  return Math.max(0, remaining);
};

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

const HeroBarCurrentGoalFill = styled('div', {
  shouldForwardProp: prop => prop !== 'start' && prop !== 'end',
})<{ start: number; end: number }>`
  position: absolute;
  inset: 0 auto 0 ${({ start }) => start}%;
  width: ${({ start, end }) => Math.max(0, end - start)}%;
  background-color: ${HERO_CURRENT_GOAL_FILL};
`;

const HeroGoalMarkers = styled('div')`
  position: relative;
  height: ${theme.spacing(3)};
`;

const HeroGoalMarker = styled('div', {
  shouldForwardProp: prop => prop !== 'position',
})<{ position: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ position }) => position}%;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(1)};
  transform: translateX(-100%);
`;

const HeroGoalMarkerLabel = styled('span')`
  font-family: ${[robotoMono.style.fontFamily, 'monospace'].join(',')};
  font-weight: 700;
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.common.white};

  ${theme.breakpoints.up('md')} {
    font-size: 0.875rem;
  }
`;

const HeroGoalMarkerTick = styled('span')`
  align-self: stretch;
  width: 2px;
  margin-bottom: ${theme.spacing(-1)};
  background-color: ${({ theme }) => theme.palette.common.white};
`;

export const ReflektCrowdfundingBlock = ({
  crowdfunding,
  blockStyle,
}: BuilderCrowdfundingBlockProps) => {
  const daysRemaining = getDaysRemaining(crowdfunding?.countSubscriptionsUntil);

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

  const formatGoalValue = (amount: number) =>
    isRevenueGoal ?
      formatCurrency(amount / 100, Currency.Chf)
    : formatNumber(amount);

  const currentValue = isRevenueGoal ? revenue : subscriptions;
  const reachedGoals = [...(crowdfunding.goals ?? [])]
    .filter(goal => goal.amount < goalAmount)
    .sort((goalA, goalB) => goalA.amount - goalB.amount);
  const hasReachedGoals = reachedGoals.length > 0;
  const reachedPercent =
    hasReachedGoals ?
      (reachedGoals[reachedGoals.length - 1].amount / goalAmount) * 100
    : 0;
  const currentPercent = Math.min(100, Math.max(0, progress));
  const allGoalsReached = hasReachedGoals && currentValue >= goalAmount;
  const showLadder = hasReachedGoals && !allGoalsReached;

  const titleContent = (
    <Trans
      i18nKey="crowdfunding.stats.progressOfGoal"
      values={{
        type: crowdfunding.goalType,
        current: formatGoalValue(currentValue),
        goal: formatGoalValue(goalAmount),
      }}
    />
  );

  const heroTitleContent =
    allGoalsReached ?
      <Trans
        i18nKey="crowdfunding.stats.allGoalsReached"
        values={{
          type: crowdfunding.goalType,
          current: formatGoalValue(currentValue),
          goal: formatGoalValue(goalAmount),
        }}
      />
    : titleContent;

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
        {showLadder && (
          <HeroGoalMarkers>
            {reachedGoals.map(goal => (
              <HeroGoalMarker
                key={goal.id}
                position={(goal.amount / goalAmount) * 100}
              >
                <HeroGoalMarkerLabel>
                  {formatGoalValue(goal.amount)} 🎉
                </HeroGoalMarkerLabel>
                <HeroGoalMarkerTick />
              </HeroGoalMarker>
            ))}
          </HeroGoalMarkers>
        )}

        <HeroBar>
          <HeroBarFill progress={showLadder ? reachedPercent : progress} />
          {showLadder && (
            <HeroBarCurrentGoalFill
              start={reachedPercent}
              end={currentPercent}
            />
          )}
          <HeroBarTitle>{heroTitleContent}</HeroBarTitle>
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
          suppressHydrationWarning
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
