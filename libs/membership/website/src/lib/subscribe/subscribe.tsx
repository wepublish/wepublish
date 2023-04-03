import styled from '@emotion/styled'
import {BuilderSubscribeProps} from '@wepublish/website/builder'

export type SubscribeProps = BuilderSubscribeProps

const StyledSubscribe = styled.div`
  color: pink;
`

export function Subscribe({className, challenge}: SubscribeProps) {
  return (
    <StyledSubscribe className={className}>
      <h1>Welcome to Subscribe!</h1>
    </StyledSubscribe>
  )
}
