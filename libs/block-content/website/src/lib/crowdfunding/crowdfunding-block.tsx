import styled from '@emotion/styled';
import { css, IconButton, LinearProgress, Theme, Tooltip } from '@mui/material';
import { formatCurrency } from '@wepublish/membership/website';
import {
  BlockContent,
  CrowdfundingBlock as CrowdfundingBlockType,
  CrowdfundingGoalType,
  Currency,
} from '@wepublish/website/api';
import {
  BuilderCrowdfundingBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Trans, useTranslation } from 'react-i18next';
import { MdOutlineInfo } from 'react-icons/md';
import { formatNumber } from './format-number';

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock';

export const CrowdfundingContainer = styled('div')``;

export const CfInner = styled('div')``;

const titleStyles = (theme: Theme) => css`
  font-weight: 400;
  line-height: 1.1;
  margin: ${theme.spacing(2)};
`;

export const CfProgressBarContainer = styled('div')`
  position: relative;
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

export const CfProgressBarInner = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1)};
  line-height: 1.1;
`;

export const CfProgressBarInnerItem = styled('div')`
  flex: 1 1 auto;
  max-width: 90%;
`;

export const CfProgressBarInnerAmount = styled('p')`
  width: 100%;
  margin: 0;
  text-align: end;
  font-weight: bold;
`;

export const CfProgressBarInnerTitle = styled('p')`
  width: 100%;
  margin: 0;
  text-align: end;
`;

const noWrap = css`
  text-wrap: nowrap;
`;

export const CrowdfundingBlock = ({
  crowdfunding,
}: BuilderCrowdfundingBlockProps) => {
  const {
    elements: { H5 },
  } = useWebsiteBuilder();

  const { t } = useTranslation();

  if (!crowdfunding) {
    return;
  }

  const activeCrowdfunding = crowdfunding?.activeGoal;
  const progress = activeCrowdfunding?.progress ?? 0;
  const revenue = crowdfunding?.revenue ?? 0;
  const subscriptions = crowdfunding?.subscriptions ?? 0;
  const goalAmount = activeCrowdfunding?.amount ?? 0;
  const goalDescription = activeCrowdfunding?.description;

  return (
    <CrowdfundingContainer>
      <CfInner>
        <H5
          component="div"
          css={titleStyles}
        >
          <Trans
            i18nKey="crowdfunding.goal"
            values={{
              type: crowdfunding.goalType,
              revenue: formatCurrency(revenue / 100, Currency.Chf),
              subscriptions,
            }}
            components={{ bold: <strong css={noWrap} /> }}
          />
        </H5>

        <CfProgressBarContainer>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={progress}
            sx={{ height: '60px' }}
          />

          <CfProgressBarInner>
            <CfProgressBarInnerItem>
              {goalDescription && (
                <Tooltip title={goalDescription}>
                  <IconButton>
                    <MdOutlineInfo size={'30px'} />
                  </IconButton>
                </Tooltip>
              )}
            </CfProgressBarInnerItem>

            <CfProgressBarInnerItem>
              <CfProgressBarInnerAmount>
                {crowdfunding?.goalType === CrowdfundingGoalType.Revenue ?
                  formatCurrency(goalAmount / 100, Currency.Chf)
                : formatNumber(goalAmount)}
              </CfProgressBarInnerAmount>

              <CfProgressBarInnerTitle>
                {crowdfunding.activeGoal?.title || ''}
              </CfProgressBarInnerTitle>
            </CfProgressBarInnerItem>
          </CfProgressBarInner>
        </CfProgressBarContainer>
      </CfInner>
    </CrowdfundingContainer>
  );
};
