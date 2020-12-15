import React, {
  ReactNode,
  forwardRef,
  ButtonHTMLAttributes,
  useCallback,
  useRef,
  useState,
  ReactElement
} from 'react'

import {Icon, Popover, Whisper} from 'rsuite'
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

interface BaseToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly active?: boolean
}

export interface ToolbarButtonProps extends BaseToolbarButtonProps {
  readonly children?: ReactNode
}

const BaseToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function BaseToolbarButton({active, children, ...props}, ref) {
    return (
      <button
        style={{
          border: active ? 'blue 1px solid' : '',
          fontSize: 16,

          cursor: 'pointer',
          borderRadius: 3,
          backgroundColor: 'transparent',

          padding: 2
        }}
        ref={ref}
        {...props}>
        {children}
      </button>
    )
  }
)

export function ToolbarButton({active, children, ...props}: ToolbarButtonProps) {
  return (
    <BaseToolbarButton active={active} {...props}>
      {children}
    </BaseToolbarButton>
  )
}

export interface ToolbarIconButtonProps extends BaseToolbarButtonProps {
  readonly icon: IconNames | SVGIcon
}

export function ToolbarIconButton({icon, active, ...props}: ToolbarIconButtonProps) {
  return (
    <BaseToolbarButton active={active} {...props}>
      <Icon icon={icon} element={icon} />
    </BaseToolbarButton>
  )
}

export interface SubMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly children: ReactElement
}

export function SubMenuButton({children, icon}: SubMenuButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const triggerRef = useRef<any>(null)

  const menuRef = useCallback((node: any) => {
    setIsMenuOpen(!!node)
  }, [])

  const menu = <Popover ref={menuRef}>{children}</Popover>

  return (
    <Whisper placement="top" speaker={menu} ref={triggerRef} trigger="none">
      <button
        style={{
          border: isMenuOpen ? 'blue 1px solid' : '',
          fontSize: 16,
          cursor: 'pointer',
          borderRadius: 3,
          backgroundColor: 'transparent',
          padding: 2
        }}
        onMouseDown={e => {
          e.preventDefault()
          !isMenuOpen ? triggerRef.current!.open() : triggerRef.current!.close()
        }}>
        <Icon icon={isMenuOpen ? 'close' : icon} />
      </button>
    </Whisper>
  )
}

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
