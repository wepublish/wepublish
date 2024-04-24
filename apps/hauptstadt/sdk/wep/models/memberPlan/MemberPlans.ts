import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'

export default class MemberPlans {
  public memberPlans: MemberPlan[]

  constructor() {
    this.memberPlans = []
  }

  /**
   * Parsing data coming from api
   * @param apiData
   */
  public parseApiData(apiData: MemberPlan[]): MemberPlans {
    this.memberPlans = []
    if (!apiData || !apiData.length) {
      return this
    }
    for (const rawMemberPlan of apiData) {
      const memberPlan = new MemberPlan(rawMemberPlan)
      this.memberPlans.push(memberPlan)
    }
    return this
  }

  public sortBySortOrder() {
    this.memberPlans.sort((a, b) => {
      return a.getSortOrder() - b.getSortOrder()
    })
    return this
  }

  public getMemberPlans(): MemberPlan[] {
    return this.memberPlans
  }

  public getMemberPlanByName(name: string): MemberPlan | undefined {
    return this.memberPlans.find(memberPlan => memberPlan.name === name)
  }
}
