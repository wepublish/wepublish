import styled from '@emotion/styled'
import {BuilderMemberPlansProps} from '@wepublish/website/builder'

export type MemberPlansProps = BuilderMemberPlansProps

const StyledMemberPlans = styled.div`
  color: pink;
`

export function MemberPlans({className, data, loading, error}: MemberPlansProps) {
  return (
    <StyledMemberPlans className={className}>
      <h1>Welcome to MemberPlans!</h1>
    </StyledMemberPlans>
  )
}
