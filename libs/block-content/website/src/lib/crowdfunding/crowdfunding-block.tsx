import styled from '@emotion/styled'
import {Alert, AlertTitle, LinearProgress} from '@mui/material'
import {FullCrowdfundingGoalWithProgressFragment} from '@wepublish/editor/api-v2'
import {BlockContent, CrowdfundingBlock as CrowdfundingBlockType} from '@wepublish/website/api'
import {BuilderCrowdfundingBlockProps} from '@wepublish/website/builder'
import {useMemo} from 'react'

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock'

export const CrowdfundingContainer = styled('div')``

export const CfInner = styled('div')`
  max-width: 800px;
`

export const CfTitle = styled('h1')`
  font-weight: 400;
  line-height: 1;
  margin-bottom: ${({theme}) => theme.spacing(2)};
  margin-left: ${({theme}) => theme.spacing(2)};
`

export const CfProgressBarContainer = styled('div')`
  position: relative;
`

export const CfProgressBarInner = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: ${({theme}) => theme.spacing(1)};
  text-align: end;
  line-height: 1.1;
`

export const CfProgressBarInnerAmount = styled('p')`
  width: 100%;
  margin: 0;
  text-align: end;
  font-weight: bold;
`

export const CfProgressBarInnerTitle = styled('p')`
  width: 100%;
  margin: 0;
  text-align: end;
`

export const CrowdfundingBlock = ({crowdfunding}: BuilderCrowdfundingBlockProps) => {
  const activeCrowdfunding = useMemo<
    FullCrowdfundingGoalWithProgressFragment | undefined | null
  >(() => {
    return crowdfunding?.activeCrowdfundingGoal
  }, [crowdfunding?.activeCrowdfundingGoal])

  const progress = useMemo<number>(
    () => activeCrowdfunding?.progress || 0,
    [activeCrowdfunding?.progress]
  )
  const goalAmount = useMemo<number>(
    () => Math.round((activeCrowdfunding?.amount || 0) / 100),
    [activeCrowdfunding?.amount]
  )

  // no crowdfunding object is available
  if (!crowdfunding)
    return (
      <Alert severity="error">
        <AlertTitle>Crowdfunding nicht verfügbar.</AlertTitle>
      </Alert>
    )

  return (
    <CrowdfundingContainer>
      <CfInner>
        <CfTitle>
          Bereits <b>{progress} %</b> finanziert
        </CfTitle>

        <CfProgressBarContainer>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={progress}
            sx={{height: '60px'}}
          />
          <CfProgressBarInner>
            <CfProgressBarInnerAmount>
              CHF{' '}
              {goalAmount.toLocaleString('de-CH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </CfProgressBarInnerAmount>
            <CfProgressBarInnerTitle>
              {crowdfunding.activeCrowdfundingGoal?.title || ''}
            </CfProgressBarInnerTitle>
          </CfProgressBarInner>
        </CfProgressBarContainer>
      </CfInner>
    </CrowdfundingContainer>
  )
}
