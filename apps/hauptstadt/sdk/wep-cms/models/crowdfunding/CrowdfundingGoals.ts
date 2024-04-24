import CrowdfundingGoal from '~/sdk/wep-cms/models/crowdfunding/CrowdfundingGoal'

export default class CrowdfundingGoals {
  public goals: CrowdfundingGoal[]

  constructor() {
    this.goals = []
  }

  public parse(goals: CrowdfundingGoal[]) {
    for (const goal of goals) {
      this.goals.push(new CrowdfundingGoal(goal))
    }
    return this
  }
}
