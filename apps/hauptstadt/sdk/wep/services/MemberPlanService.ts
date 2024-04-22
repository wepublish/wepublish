import {gql} from 'graphql-tag'
import Vue from 'vue'
import MemberPlans from '~/sdk/wep/models/memberPlan/MemberPlans'
import Service from '~/sdk/wep/services/Service'
import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'
import IMemberPlanVariables from '~/sdk/wep/models/memberPlan/IMemberPlanVariables'

export default class MemberPlanService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * @param apollo
   * @param variables
   * @return {Promise<MemberPlans|boolean>}
   */
  public async getMemberPlans({
    variables
  }: {
    variables: IMemberPlanVariables
  }): Promise<MemberPlans | false> {
    if (!variables) {
      throw new Error('Missing variables in getMemberPlans() function!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    try {
      const query = gql`
        query getMemberPlans(
          $filter: MemberPlanFilter
          $order: SortOrder
          $skip: Int
          $sort: MemberPlanSort
          $take: Int
        ) {
          memberPlans(filter: $filter, order: $order, skip: $skip, sort: $sort, take: $take) {
            nodes {
              ...memberPlan
            }
            totalCount
          }
        }
        ${MemberPlan.memberPlanFragment}
      `

      const response = await this.$apollo.query({
        query,
        variables,
        errorPolicy: 'all'
      })
      // parse api data
      const memberPlans = new MemberPlans().parseApiData(response.data.memberPlans.nodes)
      this.loadingFinish()
      return memberPlans
    } catch (e) {
      return false
    }
  }
}
