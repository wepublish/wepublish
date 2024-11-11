import {styled} from '@mui/material'
import {ApiV1, BuilderSubscribeProps, Subscribe} from '@wepublish/website'
import {useMemo} from 'react'

import {CrowdfundingGoal} from './crowdfunding/crowdfunding-goal'

const goals = [{goal: 700, until: new Date()}]

export const GoalsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export const FinancedWrapper = styled('div')`
  font-size: ${({theme}) => theme.typography.h4.fontSize};
  text-align: center;
`

export const KolumnaSubscribeWrapper = styled(Subscribe)`
  .MuiSlider-root {
    color: ${({theme}) => theme.palette.primary.main};
  }
`

export const KolumnaSubscribe = (props: BuilderSubscribeProps) => {
  const {data} = ApiV1.useNewSubscribersQuery({
    variables: {
      start: '2024-01-11T00:00:00.000Z',
      end: '2025-01-11T00:00:00.000Z'
    }
  })

  const current = useMemo(
    () =>
      data?.newSubscribers.filter(
        ({memberPlan}) =>
          props.memberPlans.data?.memberPlans.nodes.some(({name}) => name === memberPlan),
        0
      ).length ?? 0,
    [data, props.memberPlans]
  )

  return (
    <>
      <GoalsWrapper>
        <FinancedWrapper>
          Bereits <strong>{current}</strong> machen mit!
        </FinancedWrapper>

        {goals.map((goal, index) => (
          <CrowdfundingGoal key={index} {...goal} current={current} />
        ))}
      </GoalsWrapper>

      <KolumnaSubscribeWrapper {...props} />
    </>
  )
}
