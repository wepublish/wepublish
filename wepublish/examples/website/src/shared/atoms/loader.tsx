import React from 'react'
import {cssRule, useStyle, cssKeyframes} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

export interface LoaderProps {
  text: string
}

const LoaderStyle = cssRule({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: `${pxToRem(100)} ${pxToRem(20)}`
})

const keyframe = cssKeyframes(() => ({
  '0%': {fill: Color.Secondary},
  '25%': {fill: Color.PrimaryDark},
  '50%': {fill: Color.Secondary},
  '100%': {fill: Color.Secondary}
}))

const IconStyle = cssRule((props, renderer) => {
  const animation = renderer.renderKeyframe(keyframe as any, {})

  return {
    fill: 'red',
    display: 'block',
    maxWidth: pxToRem(100),
    margin: '0 auto',

    '&>path:nth-child(4)': {
      fill: Color.Secondary,
      animation: `${animation} 1250ms linear infinite`
    },

    '&>path:nth-child(3)': {
      fill: Color.Secondary,
      animation: `${animation} 1250ms linear infinite 250ms`
    },

    '&>path:nth-child(2)': {
      fill: Color.Secondary,
      animation: `${animation} 1250ms linear infinite 500ms`
    },

    '&>path:nth-child(1)': {
      fill: Color.Secondary,
      animation: `${animation} 1250ms linear infinite 750ms`
    }
  }
})

const TextStyle = cssRule({
  fontSize: pxToRem(14),
  textTransform: 'uppercase',
  display: 'block',
  textAlign: 'center',
  margin: `${pxToRem(25)} 0`
})

export function Loader({text}: LoaderProps) {
  const css = useStyle()

  return (
    <div className={css(LoaderStyle)}>
      <svg className={css(IconStyle)} viewBox="0 0 41 36" fill="none">
        <path
          d="M20.0612 5.37654C36.8708 6.08773 35.6211 2.55717 35.3468 2.25237C34.2241 1.41926 32.9186 0.774111 31.4454 0.367715C26.9801 -0.851471 22.1948 1.03319 20.0612 5.22414C18.1867 1.5361 14.265 -0.363797 10.3077 0.0578386L9.29172 0.220397C9.08853 0.261036 8.88025 0.311836 8.67706 0.367715C4.7401 1.43958 2.01724 4.24371 0.767578 7.70315C0.904737 7.40344 2.637 4.63487 20.0612 5.37654Z"
          fill="#202020"
        />
        <path
          d="M19.2551 14.6828C39.8797 15.7089 40.1286 11.8533 40.1286 11.8533C40.0727 9.71461 39.5241 7.66232 38.5233 5.87418C38.6249 6.15865 39.6866 10.0601 20.0781 9.29298C1.21114 8.55131 0.0376737 11.8431 0.00211406 11.9549C-0.0232857 13.4179 0.17991 14.9165 0.626945 16.3897C0.779343 16.8875 0.972379 17.4006 1.1959 17.9187L1.21114 17.9238C1.21114 17.9136 0.291675 13.7379 19.2551 14.6828Z"
          fill="#202020"
        />
        <path
          d="M20.1083 24.7568C32.8336 25.3817 35.5209 23.2887 35.9882 22.7655C37.6443 20.5913 38.8838 18.3967 39.4985 16.38C39.5391 16.253 39.5696 16.126 39.6051 15.9939C39.3969 16.5222 37.3801 20.0731 20.6163 19.2197C2.25739 18.285 3.31402 21.5971 3.33942 21.6733C4.61448 23.5122 6.20959 25.3563 7.99773 27.0885C7.96217 27.0326 6.12323 24.071 20.1083 24.7568Z"
          fill="#202020"
        />
        <path
          d="M20.1073 29.3844C10.2726 28.7545 11.9845 30.5224 12.0251 30.563C14.6261 32.5442 17.4048 34.1901 20.0616 35.2264C23.9173 33.7227 28.0219 30.9389 31.4915 27.6979C30.6838 28.338 27.8898 29.8823 20.1073 29.3844Z"
          fill="#202020"
        />
      </svg>
      <p className={css(TextStyle)}>{text}</p>
    </div>
  )
}
