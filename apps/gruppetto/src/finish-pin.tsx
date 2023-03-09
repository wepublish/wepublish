import {css, styled} from '@mui/material'

export type FinishPinProps = {
  milestone: {x: number; y: number}
}

const FinishPinWrapper = styled('div')<Pick<FinishPinProps, 'milestone'>>`
  position: absolute;
  left: ${({milestone}) => milestone.x * 100}%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  color: ${({theme}) => theme.palette.primary.main};
  margin-top: -115px;

  ${({theme, milestone}) => css`
    ${theme.breakpoints.up('md')} {
      margin-top: 0;
      top: initial;
      bottom: ${milestone.y * 100}%;
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

export const FinishPin = ({milestone}: FinishPinProps) => (
  <FinishPinWrapper milestone={milestone}>
    <FinishPinInnerWrapper>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 72 28">
        <g clipPath="url(#a)">
          <rect width="71.1335" height="27.1981" x=".164795" y=".750977" fill="#fff" rx="13.599" />
          <path
            fill="#F084AD"
            d="M7.48804 14.3492h7.06105v7.06105H7.48804zM35.7319 14.3492h7.06105v7.06105H35.7319zM63.9763 14.3492h7.06105v7.06105H63.9763zM-6.63452 14.3492H.42653v7.06105h-7.06105zM21.6094 14.3492h7.06105v7.06105H21.6094zM49.8535 14.3492h7.06105v7.06105H49.8535zM7.48804.228558h7.06105v7.06105H7.48804zM35.7319.228558h7.06105v7.06105H35.7319zM63.9763.228558h7.06105v7.06105H63.9763zM-6.63452.228558H.42653v7.06105h-7.06105zM21.6094.228558h7.06105v7.06105H21.6094zM49.8535.228558h7.06105v7.06105H49.8535zM14.5483 21.4122h7.06105v7.06105H14.5483zM42.793 21.4122h7.06105v7.06105H42.793zM71.0366 21.4122h7.06105v7.06105H71.0366zM.42627 21.4122h7.06105v7.06105H.42627zM28.6711 21.4122h7.06105v7.06105H28.6711zM56.915 21.4122h7.06105v7.06105H56.915z"
          />
          <path
            fill="#F084AD"
            d="M14.5483 7.28888h7.06105v7.06105H14.5483zM42.793 7.28888h7.06105v7.06105H42.793zM71.0366 7.28888h7.06105v7.06105H71.0366zM.42627 7.28888h7.06105v7.06105H.42627zM28.6711 7.28888h7.06105v7.06105H28.6711zM56.915 7.28888h7.06105v7.06105H56.915z"
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
