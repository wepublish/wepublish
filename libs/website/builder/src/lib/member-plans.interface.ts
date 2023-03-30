import {QueryResult} from '@apollo/client'
import {MemberPlanListQuery} from '@wepublish/website/api'

export type BuilderMemberPlansProps = Pick<
  QueryResult<MemberPlanListQuery>,
  'data' | 'loading' | 'error'
> & {className?: string}
