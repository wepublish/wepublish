import {FullCrowdfundingWithActiveGoalFragment} from '@wepublish/editor/api-v2'
import {useMemo} from 'react'
import {Progress} from 'rsuite'

export function CrowdfundingProgressBar({
  crowdfunding
}: {
  crowdfunding: Partial<FullCrowdfundingWithActiveGoalFragment>
}) {
  const progress = useMemo<number>(
    () => crowdfunding.activeCrowdfundingGoal?.progress || 0,
    [crowdfunding.activeCrowdfundingGoal?.progress]
  )

  function formatMoney(amount: number): string {
    return Math.round(amount / 100).toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <>
      <h3>Bereits CHF {formatMoney(crowdfunding.revenue || 0)} finanziert</h3>
      <Progress.Line style={{marginLeft: 0}} percent={progress} />
    </>
  )
}
