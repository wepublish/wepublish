import {Chip, css, styled} from '@mui/material'
import {memo, ReactNode} from 'react'

export type MountainTopPinProps = {
  x: number
  y: number
  pill: ReactNode
  text: ReactNode
}

const MountainTopPinWrapper = styled('div')<Pick<MountainTopPinProps, 'x' | 'y'>>`
  font-size: 14px;
  position: absolute;
  margin-top: -120px;
  left: ${({x}) => x * 100}%;
  top: 0;
  bottom: ${({y}) => y * 100}%;
  transform: translateX(-50%);
  color: ${({theme}) => theme.palette.primary.main};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      margin-top: 0;
      top: initial;
    }
  `}

  &::before {
    content: '';
    width: 0.5px;
    position: absolute;
    top: 100px;
    bottom: 0;
    left: 50%;
    background-color: currentColor;

    ${({theme}) => css`
      ${theme.breakpoints.up('md')} {
        top: initial;
        height: 31px;
      }
    `}
  }
`

const MountainTopPinInnerWrapper = styled('div')`
  display: grid;
  grid-template-rows: max-content max-content;
  grid-template-columns: max-content;
  justify-items: center;
  transform: ${({theme}) => `translateY(calc(-50% - ${theme.spacing(1)}))`};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(1)};
    }
  `}
`

const Pill = styled(Chip)`
  font-weight: 700;
`

const Text = styled('div')`
  transform: rotate(90deg) translatex(50%);

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      transform: initial;
    }
  `}
`

const MountainTopPin = ({x, y, pill, text}: MountainTopPinProps) => (
  <MountainTopPinWrapper x={x} y={y}>
    <MountainTopPinInnerWrapper>
      <Pill label={pill} color="primary" size="small"></Pill>
      <Text>{text}</Text>
    </MountainTopPinInnerWrapper>
  </MountainTopPinWrapper>
)

const ConnectedMountainTopPin = memo(MountainTopPin)
export {ConnectedMountainTopPin as MountainTopPin}
