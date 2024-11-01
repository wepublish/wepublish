import {styled} from '@mui/material'
import {ApiV1, formatCurrency, useWebsiteBuilder} from '@wepublish/website'
import {lighten} from 'polished'

export const CrowdfundingGoalWrapper = styled('div')`
  position: relative;
  background: ${({theme}) => lighten(0.15, theme.palette.primary.main)};
  color: ${({theme}) => theme.palette.primary.contrastText};
  display: grid;
  justify-items: end;
  padding: ${({theme}) => theme.spacing(1)};
  font-size: 0.875em;
  font-weight: 500;
`

export const CrowdfundingGoalCurrent = styled('div')`
  background: ${({theme}) => theme.palette.primary.main};
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
  name: string
}

export const CrowdfundingGoal = ({current, goal, until, name}: CrowdfundingGoalProps) => {
  const {
    meta: {locale},
    date
  } = useWebsiteBuilder()

  return (
    <CrowdfundingGoalWrapper>
      <CrowdfundingGoalCurrent sx={{width: `${(current / goal) * 100}%`}} />

      <CrowdfundingGoalText>
        <CrowdfundingGoalAmount>
          {formatCurrency(current, ApiV1.Currency.Eur, locale)} von{' '}
          <strong>{formatCurrency(goal, ApiV1.Currency.Eur, locale)}</strong>
        </CrowdfundingGoalAmount>

        <CrowdfundingGoalUntil>
          {name} bis {date.format(until, false)}
        </CrowdfundingGoalUntil>
      </CrowdfundingGoalText>
    </CrowdfundingGoalWrapper>
  )
}
