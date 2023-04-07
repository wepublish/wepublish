import styled from '@emotion/styled'

/* eslint-disable-next-line */
export interface UiEditorProps {}

const StyledUiEditor = styled.div`
  color: pink;
`

export function UiEditor(props: UiEditorProps) {
  return (
    <StyledUiEditor>
      <h1>Welcome to UiEditor!</h1>
    </StyledUiEditor>
  )
}

export default UiEditor
