import {SortOrder} from '~/sdk/wep/interfacesAndTypes/WePublish'

export interface IMemberPlanFilter {
  name?: string
  active?: boolean
  tags?: [string]
}

export type MemberPlanSort = 'CREATED_AT' | 'MODIFIED_AT'

export default interface IMemberPlanVariables {
  filter?: IMemberPlanFilter
  order?: SortOrder
  skip?: number
  sort?: MemberPlanSort
  take?: number
}
