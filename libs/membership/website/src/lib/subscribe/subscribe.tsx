import styled from '@emotion/styled'
import {BuilderSubscribeProps} from '@wepublish/website-builder'

export type SubscribeProps = BuilderSubscribeProps

const StyledSubscribe = styled.div`
  color: pink;
`

export function Subscribe({challenge}: SubscribeProps) {
  return (
    <StyledSubscribe>
      <h1>Welcome to Subscribe!</h1>
    </StyledSubscribe>
  )
}
