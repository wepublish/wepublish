import {styled} from '@mui/material'
import {
  ApiV1,
  BuilderSubscribeProps,
  formatCurrency,
  Subscribe,
  useWebsiteBuilder
} from '@wepublish/website'
import {useMemo} from 'react'

import {CrowdfundingGoal} from './crowdfunding/crowdfunding-goal'

const goals = [{goal: 30000, name: 'Initiales Ziel', until: new Date()}]

export const GoalsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export const FinancedWrapper = styled('div')`
  font-size: ${({theme}) => theme.typography.h4.fontSize};
  text-align: center;
`

export const KolumnaSubscribe = (props: BuilderSubscribeProps) => {
  const {
    meta: {locale}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useRevenueQuery({
    variables: {
      start: new Date('01-11-2024').toISOString(),
      end: new Date('01-11-2025').toISOString()
    }
  })

  const current = useMemo(
    () =>
      data?.revenue.reduce((total, {memberPlan, amount}) => {
        if (props.memberPlans.data?.memberPlans.nodes.some(({name}) => name === memberPlan)) {
          return total + amount
        }

        return total
      }, 0) ?? 0,
    [data, props.memberPlans]
  )

  return (
    <>
      <GoalsWrapper>
        <FinancedWrapper>
          Bereits <strong>{formatCurrency(current, ApiV1.Currency.Eur, locale)}</strong> finanziert
        </FinancedWrapper>

        {goals.map((goal, index) => (
          <CrowdfundingGoal key={index} {...goal} current={current} />
        ))}
      </GoalsWrapper>

      <Subscribe {...props} />
    </>
  )
}
