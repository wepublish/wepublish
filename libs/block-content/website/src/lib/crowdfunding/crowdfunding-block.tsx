import styled from '@emotion/styled'
import {Alert, AlertTitle, LinearProgress, Typography} from '@mui/material'
import {BlockContent, CrowdfundingBlock as CrowdfundingBlockType} from '@wepublish/website/api'
import {BuilderCrowdfundingBlockProps} from '@wepublish/website/builder'

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock'

export const CrowdfundingContainer = styled('div')``

export const CrowdfundingInner = styled('div')`
  max-width: 800px;
`

export const CrowdfundingTitle = styled('h1')`
  font-weight: 400;
`

export const CrowdfundingProgressBarContainer = styled('div')`
  position: relative;
`

export const CrowdfundingProgressBarInner = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  padding: ${({theme}) => theme.spacing(1)};
  text-align: end;
`

export const CrowdfundingBlock = ({crowdfunding}: BuilderCrowdfundingBlockProps) => {
  // no crowdfunding object is available
  if (!crowdfunding)
    return (
      <Alert severity="error">
        <AlertTitle>Crowdfunding nicht verfügbar.</AlertTitle>
      </Alert>
    )

  return (
    <CrowdfundingContainer>
      <CrowdfundingInner>
        <CrowdfundingTitle>
          Bereits {crowdfunding.activeCrowdfundingGoal?.progress || 0} % finanziert
        </CrowdfundingTitle>

        <CrowdfundingProgressBarContainer>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={crowdfunding.activeCrowdfundingGoal?.progress || 0}
            sx={{height: '60px'}}
          />
          <CrowdfundingProgressBarInner>
            <b>CHF 300'000</b>
            <div>{crowdfunding.activeCrowdfundingGoal?.title || ''}</div>
          </CrowdfundingProgressBarInner>
        </CrowdfundingProgressBarContainer>

        <Typography variant="subtitle2">
          {crowdfunding.activeCrowdfundingGoal?.progress || 0} %
        </Typography>
      </CrowdfundingInner>
    </CrowdfundingContainer>
  )
}
