import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website'
import {lighten} from 'polished'

export const CrowdfundingGoalWrapper = styled('div')`
  position: relative;
  background: ${({theme}) => lighten(0.15, theme.palette.secondary.main)};
  color: ${({theme}) => theme.palette.secondary.contrastText};
  display: grid;
  justify-items: end;
  padding: ${({theme}) => theme.spacing(1)};
  font-size: 0.875em;
  font-weight: 500;
`

export const CrowdfundingGoalCurrent = styled('div')`
  background: ${({theme}) => theme.palette.secondary.main};
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
`

export const CrowdfundingGoalText = styled('div')`
  display: grid;
`

export const CrowdfundingGoalAmount = styled('div')`
  text-align: right;
`

export const CrowdfundingGoalUntil = styled('div')``

export type CrowdfundingGoalProps = {
  current: number
  goal: number
  until: Date
  name?: string
}

export const CrowdfundingGoal = ({current, goal, until, name}: CrowdfundingGoalProps) => {
  const {date} = useWebsiteBuilder()

  return (
    <CrowdfundingGoalWrapper>
      <CrowdfundingGoalCurrent css={{width: `${(current / goal) * 100}%`}} />

      <CrowdfundingGoalText>
        <CrowdfundingGoalAmount>
          {current} von <strong>{goal}</strong> machen mit
        </CrowdfundingGoalAmount>
      </CrowdfundingGoalText>
    </CrowdfundingGoalWrapper>
  )
}
