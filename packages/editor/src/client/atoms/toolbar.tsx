import React, {ReactNode, forwardRef, ButtonHTMLAttributes} from 'react'

import {Icon} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

export interface ToolbarProps {
  readonly fadeOut?: boolean
  readonly children?: ReactNode
}

export function Toolbar({fadeOut = false, children}: ToolbarProps) {
  return (
    <div
      style={{
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        position: 'sticky',
        top: 60 + 10, // TODO: Don't hardcode NavigationBar height into the toolbar, move all the position sticky stuff into own component
        zIndex: 1,
        marginBottom: 30
      }}>
      <div
        style={{
          pointerEvents: 'auto',
          padding: 5,
          backgroundColor: 'white',
          borderRadius: 6,

          transitionProperty: 'opacity',
          transitionDuration: '100ms'
        }}>
        <div
          style={{
            display: 'flex',
            opacity: fadeOut ? 0.5 : 1,
            transitionProperty: 'opacity',
            transitionDuration: '100ms'
          }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly active?: boolean
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton({icon, active, ...props}, ref) {
    return (
      <button
        style={{
          // fill: isActive ? 'blue' : 'black',
          border: active ? 'blue 1px solid' : '',
          fontSize: 16,

          cursor: 'pointer',
          // border: 'none',
          borderRadius: 3,
          backgroundColor: 'transparent',

          padding: 2

          /* ':hover': {
          backgroundColor: 'gray'
        },

        ':focus': {
          outline: 'none',
          backgroundColor: 'gray'
        } */
        }}
        ref={ref}
        {...props}>
        <Icon icon={icon} element={icon} />
      </button>
    )
  }
)

export function ToolbarDivider() {
  return (
    <div
      style={{
        width: '1px',
        alignSelf: 'stretch',

        marginLeft: 20,
        marginRight: 20,
        marginTop: 2,
        marginBottom: 2,

        backgroundColor: 'gray'
      }}
    />
  )
}
