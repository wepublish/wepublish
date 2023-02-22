import styled from '@emotion/styled'

/* eslint-disable-next-line */
export interface MembershipEditorProps {}

const StyledMembershipEditor = styled.div`
  color: pink;
`

export function MembershipEditor(props: MembershipEditorProps) {
  return (
    <StyledMembershipEditor>
      <h1>Welcome to MembershipEditor!</h1>
    </StyledMembershipEditor>
  )
}

export default MembershipEditor
