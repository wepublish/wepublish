import styled from '@emotion/styled'
import {Alert, AlertTitle, IconButton, LinearProgress, Tooltip} from '@mui/material'
import {FullCrowdfundingGoalWithProgressFragment} from '@wepublish/editor/api-v2'
import {BlockContent, CrowdfundingBlock as CrowdfundingBlockType} from '@wepublish/website/api'
import {BuilderCrowdfundingBlockProps} from '@wepublish/website/builder'
import {useMemo} from 'react'
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
  const activeCrowdfunding = useMemo<
    FullCrowdfundingGoalWithProgressFragment | undefined | null
  >(() => {
    return crowdfunding?.activeCrowdfundingGoal
  }, [crowdfunding?.activeCrowdfundingGoal])

  const progress = useMemo<number>(
    () => activeCrowdfunding?.progress || 0,
    [activeCrowdfunding?.progress]
  )

  const revenue = useMemo<number>(() => crowdfunding?.revenue || 0, [crowdfunding?.revenue])

  const goalAmount = useMemo<number>(
    () => activeCrowdfunding?.amount || 0,
    [activeCrowdfunding?.amount]
  )
  const goalDescription = useMemo(
    () => activeCrowdfunding?.description,
    [activeCrowdfunding?.description]
  )

  function formatMoney(amount: number): string {
    return Math.round(amount / 100).toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

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
          Bereits <b style={{textWrap: 'nowrap'}}>CHF {formatMoney(revenue)}</b> finanziert
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
              <CfProgressBarInnerAmount>CHF {formatMoney(goalAmount)}</CfProgressBarInnerAmount>
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
