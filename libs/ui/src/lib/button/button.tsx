import styled from '@emotion/styled'
import {PropsWithChildren} from 'react'

export type ButtonProps = PropsWithChildren

export const ButtonWrapper = styled.button``

export function Button({children}: ButtonProps) {
  return <ButtonWrapper>{children}</ButtonWrapper>
}
