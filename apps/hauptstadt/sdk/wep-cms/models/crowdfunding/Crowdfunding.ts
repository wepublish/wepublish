import moment, {Moment} from 'moment'
import CrowdfundingGoals from '~/sdk/wep-cms/models/crowdfunding/CrowdfundingGoals'
import CrowdfundingGoal from '~/sdk/wep-cms/models/crowdfunding/CrowdfundingGoal'

export type CrowdfundingType = {
  id: string
  title: string
  lastSync?: Moment
  totalRevenue?: number
  totalSoldProducts?: number
  additionalRevenue?: number
  additionalSoldProducts?: number
  goals?: CrowdfundingGoal[]
}

export default class Crowdfunding {
  public id: string
  public title: string
  public lastSync?: Moment
  public totalRevenue: number
  public totalSoldProducts: number
  public additionalRevenue: number
  public additionalSoldProducts: number
  public goals: CrowdfundingGoals

  constructor({
    id,
    title,
    lastSync,
    totalRevenue,
    totalSoldProducts,
    additionalRevenue,
    additionalSoldProducts,
    goals
  }: CrowdfundingType) {
    this.id = id
    this.title = title
    this.lastSync = lastSync ? moment(lastSync) : undefined
    this.totalRevenue = totalRevenue || 0
    this.totalSoldProducts = totalSoldProducts || 0
    this.additionalRevenue = additionalRevenue || 0
    this.additionalSoldProducts = additionalSoldProducts || 0
    this.goals = goals ? new CrowdfundingGoals().parse(goals) : new CrowdfundingGoals()
  }

  public getTotalRevenue(): number {
    return this.totalRevenue + this.additionalRevenue
  }
}
