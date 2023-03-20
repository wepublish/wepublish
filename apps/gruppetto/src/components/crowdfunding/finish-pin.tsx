import {css, styled} from '@mui/material'
import {memo} from 'react'

export type FinishPinProps = {
  x: number
  y: number
}

const FinishPinWrapper = styled('div')<Pick<FinishPinProps, 'x' | 'y'>>`
  position: absolute;
  left: ${({x}) => x * 100}%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  color: ${({theme}) => theme.palette.primary.main};
  margin-top: -115px;

  ${({theme, y}) => css`
    ${theme.breakpoints.up('md')} {
      margin-top: 0;
      top: initial;
      bottom: ${y * 100}%;
    }
  `}

  &::before {
    content: '';
    width: 0.5px;
    position: absolute;
    top: 0;
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

const FinishPinInnerWrapper = styled('div')`
  display: grid;
  grid-template-columns: 32px;
  justify-items: center;
  transform: translateY(calc(-100% - 18px));

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      transform: translateY(calc(-100% - ${theme.spacing(1)}));
      grid-template-columns: 66px;
    }
  `}
`

const FinishPin = ({x, y}: FinishPinProps) => (
  <FinishPinWrapper x={x} y={y}>
    <FinishPinInnerWrapper>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 72 28">
        <g clipPath="url(#a)">
          <rect width="71.1335" height="27.1981" x=".164795" y=".750977" fill="#fff" rx="13.599" />
          <path
            fill="#F084AD"
            d="M7.48804 14.3492h7.06105v7.06105H7.48804zm28.24386 0h7.06105v7.06105H35.7319zm28.2444 0h7.06105v7.06105H63.9763zm-70.61082 0H.42653v7.06105h-7.06105zm28.24392 0h7.06105v7.06105H21.6094zm28.2441 0h7.06105v7.06105H49.8535zM7.48804.228558h7.06105v7.06105H7.48804zm28.24386 0h7.06105v7.06105H35.7319zm28.2444 0h7.06105v7.06105H63.9763zm-70.61082 0H.42653v7.06105h-7.06105zm28.24392 0h7.06105v7.06105H21.6094zm28.2441 0h7.06105v7.06105H49.8535zM14.5483 21.4122h7.06105v7.06105H14.5483zm28.2447 0h7.06105v7.06105H42.793zm28.2436 0h7.06105v7.06105H71.0366zm-70.61033 0h7.06105v7.06105H.42627zm28.24483 0h7.06105v7.06105H28.6711zm28.2439 0h7.06105v7.06105H56.915z"
          />
          <path
            fill="#F084AD"
            d="M14.5483 7.28888h7.06105v7.06105H14.5483zm28.2447 0h7.06105v7.06105H42.793zm28.2436 0h7.06105v7.06105H71.0366zm-70.61033 0h7.06105v7.06105H.42627zm28.24483 0h7.06105v7.06105H28.6711zm28.2439 0h7.06105v7.06105H56.915z"
          />
        </g>

        <defs>
          <clipPath id="a">
            <rect
              width="71.1335"
              height="27.1981"
              x=".164795"
              y=".750977"
              fill="#fff"
              rx="13.599"
            />
          </clipPath>
        </defs>
      </svg>
    </FinishPinInnerWrapper>
  </FinishPinWrapper>
)

const ConnectedFinishPin = memo(FinishPin)
export {ConnectedFinishPin as FinishPin}
