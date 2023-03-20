import {Chip, css, styled} from '@mui/material'
import {memo, ReactNode} from 'react'

export type PelotonPinProps = {
  x: number
  text: ReactNode
  subText: ReactNode
}

const PelotonPinWrapper = styled('div')<Pick<PelotonPinProps, 'x'>>`
  position: absolute;
  left: ${({x}) => x * 100}%;
  top: -250px;
  bottom: 0;
  transform: translateX(-50%);
  color: ${({theme}) => theme.palette.secondary.main};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      text-align: center;
      top: -100px;
    }
  `}

  &::before {
    content: '';
    width: 0.5px;
    position: absolute;
    top: 85px;
    bottom: 0;
    left: 50%;
    background-color: ${({theme}) => theme.palette.secondary.main};

    ${({theme}) => css`
      ${theme.breakpoints.up('md')} {
        top: 0;
      }
    `}
  }
`

const PelotonPinInnerWrapper = styled('div')`
  display: grid;
  grid-template-rows: 0;
  grid-template-columns: max-content;
  justify-items: center;
  transform: ${({theme}) => `translateY(calc(-100% - ${theme.spacing(1)}))`};
  gap: ${({theme}) => theme.spacing(1)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-rows: max-content max-content;
    }
  `}
`

const Pill = styled(Chip)`
  font-weight: 700;
`

const TextWrapper = styled('div')`
  display: grid;
  transform: rotate(90deg) translatex(50%);

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      transform: initial;
    }
  `}
`

const Text = styled('strong')``
const SubText = styled('small')``

const PelotonPin = ({x, text, subText}: PelotonPinProps) => (
  <PelotonPinWrapper x={x}>
    <PelotonPinInnerWrapper>
      <Pill label="Peloton" color="secondary" size="small"></Pill>

      <TextWrapper>
        <Text>{text}</Text>
        <SubText>{subText}</SubText>
      </TextWrapper>
    </PelotonPinInnerWrapper>
  </PelotonPinWrapper>
)

const ConnectedPelotonPin = memo(PelotonPin)
export {ConnectedPelotonPin as PelotonPin}
