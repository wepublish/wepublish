import {css, styled} from '@mui/material'
import {memo} from 'react'
import {Logo} from '../logo'

export type GruppettoPinProps = {
  x: number
}

const GruppettoPinWrapper = styled('div')<Pick<GruppettoPinProps, 'x'>>`
  position: absolute;
  left: ${({x}) => x * 100}%;
  top: -291px;
  bottom: 0;
  transform: translateX(-50%);

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      top: -130px;
    }
  `}

  &::before {
    content: '';
    width: 0.5px;
    position: absolute;
    top: 127px;
    bottom: 0;
    left: 50%;
    background-color: ${({theme}) => theme.palette.primary.dark};

    ${({theme}) => css`
      ${theme.breakpoints.up('md')} {
        top: 30px;
      }
    `}
  }
`

const GruppettoPinInnerWrapper = styled('div')`
  display: grid;
  grid-template-columns: 100px;
  justify-items: center;
  transform: rotate(90deg) translatex(50%);

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      transform: translateY(calc(-50%));
    }
  `}
`

const GruppettoPin = ({x}: GruppettoPinProps) => (
  <GruppettoPinWrapper x={x}>
    <GruppettoPinInnerWrapper>
      <Logo />
    </GruppettoPinInnerWrapper>
  </GruppettoPinWrapper>
)

const ConnectedGruppettoPin = memo(GruppettoPin)
export {ConnectedGruppettoPin as GruppettoPin}
