export interface CrowdfundingGoalProps {
  id: string
  title: string
  description: string
  amount: number
}
export default class CrowdfundingGoal {
  public id: string
  public title: string
  public description: string
  public amount: number

  constructor({id, title, description, amount}: CrowdfundingGoalProps) {
    this.id = id
    this.title = title
    this.description = description
    this.amount = amount
  }
}
