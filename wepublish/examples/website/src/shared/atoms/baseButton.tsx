import React, {ReactNode, MouseEventHandler} from 'react'

import {cssRule, CSSRule, useStyle} from '@karma.run/react'
import {toArray} from '@karma.run/utility'

export interface ButtonProps {
  readonly href?: string
  readonly rel?: string
  readonly title?: string
  readonly children?: ReactNode
  readonly onClick?: MouseEventHandler
  readonly disabled?: boolean
}

export interface BaseButtonProps<P = undefined> extends ButtonProps {
  readonly css?: CSSRule<P> | CSSRule<P>[]
  readonly cssProps?: P
}

export interface BaseButtonPropsWithoutCSSProps extends ButtonProps {
  readonly css?: CSSRule | CSSRule[]
}

export interface BaseButtonPropsWithCSSProps<P = undefined> extends ButtonProps {
  readonly css?: CSSRule<P> | CSSRule<P>[]
  readonly cssProps: P
}

const BaseButtonStyle = cssRule({
  display: 'inline-block',

  cursor: 'pointer',
  fontSize: 'inherit',
  fontFamily: 'inherit',

  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,

  borderTopStyle: 'none',
  borderTopColor: 'transparent',
  borderTopWidth: 0,

  borderBottomStyle: 'none',
  borderBottomColor: 'transparent',
  borderBottomWidth: 0,

  borderLeftStyle: 'none',
  borderLeftColor: 'transparent',
  borderLeftWidth: 0,

  borderRightStyle: 'none',
  borderRightColor: 'transparent',
  borderRightWidth: 0,

  backgroundColor: 'transparent',
  appearance: 'none',

  ':disabled': {
    cursor: 'default'
  },

  ':focus': {
    outline: 'none'
  }
})

export function BaseButton(props: BaseButtonPropsWithoutCSSProps): JSX.Element
export function BaseButton<P = undefined>(props: BaseButtonPropsWithCSSProps<P>): JSX.Element
export function BaseButton<P = undefined>({
  href,
  css: cssStyles,
  cssProps,
  children,
  ...props
}: BaseButtonProps<P>): JSX.Element {
  const css = useStyle<P>(cssProps as P)
  const Element = href ? 'a' : 'button'

  return (
    <Element {...props} href={href} className={css(BaseButtonStyle, ...toArray(cssStyles))}>
      {children}
    </Element>
  )
}
