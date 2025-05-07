import styled from '@emotion/styled'
import {Alert, AlertTitle, IconButton, LinearProgress, Tooltip} from '@mui/material'
import {formatCurrency} from '@wepublish/membership/website'
import {
  BlockContent,
  CrowdfundingBlock as CrowdfundingBlockType,
  Currency
} from '@wepublish/website/api'
import {BuilderCrowdfundingBlockProps} from '@wepublish/website/builder'
import {MdOutlineInfo} from 'react-icons/md'

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock'

export const CrowdfundingContainer = styled('div')``

export const CfInner = styled('div')``

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
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: ${({theme}) => theme.spacing(1)};
  line-height: 1.1;
`

export const CfProgressBarInnerItem = styled('div')`
  flex: 1 1 auto;
  max-width: 90%;
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
  const activeCrowdfunding = crowdfunding?.activeCrowdfundingGoal
  const progress = activeCrowdfunding?.progress || 0
  const revenue = crowdfunding?.revenue || 0
  const goalAmount = activeCrowdfunding?.amount || 0
  const goalDescription = activeCrowdfunding?.description

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
          Bereits <b style={{textWrap: 'nowrap'}}>{formatCurrency(revenue / 100, Currency.Chf)}</b>{' '}
          finanziert
        </CfTitle>

        <CfProgressBarContainer>
          <LinearProgress
            variant="determinate"
            color="primary"
            value={progress}
            sx={{height: '60px'}}
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
                {formatCurrency(goalAmount / 100, Currency.Chf)}
              </CfProgressBarInnerAmount>
              <CfProgressBarInnerTitle>
                {crowdfunding.activeCrowdfundingGoal?.title || ''}
              </CfProgressBarInnerTitle>
            </CfProgressBarInnerItem>
          </CfProgressBarInner>
        </CfProgressBarContainer>
      </CfInner>
    </CrowdfundingContainer>
  )
}
