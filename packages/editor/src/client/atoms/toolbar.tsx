import React, {
  ReactNode,
  forwardRef,
  ButtonHTMLAttributes,
  useCallback,
  useRef,
  useState,
  createContext,
  ReactEventHandler
} from 'react'

import {Icon, Popover, PopoverProps, Whisper} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

export interface ToolbarProps {
  readonly onMouseDown?: ReactEventHandler
  readonly fadeOut?: boolean
  readonly children?: ReactNode
}

export function Toolbar({onMouseDown, fadeOut = false, children}: ToolbarProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        position: 'sticky',
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

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({active, children, ...props}, ref) => {
    return (
      <button
        style={{
          border: `${active ? 'blue' : 'transparent'} 1px solid`,
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

export interface ToolbarIconButtonProps extends BaseToolbarButtonProps {
  readonly icon: IconNames | SVGIcon
}

export function ToolbarIconButton({icon, active, ...props}: ToolbarIconButtonProps) {
  return (
    <ToolbarButton active={active} {...props}>
      <Icon icon={icon} element={icon} />
    </ToolbarButton>
  )
}

interface SubMenuContextProps {
  closeMenu: () => void
  openMenu: () => void
}

const emtpyFn = () => {
  /* do nothing */
}

export const SubMenuContext = createContext<SubMenuContextProps>({
  closeMenu: emtpyFn,
  openMenu: emtpyFn
})

export interface SubMenuButtonProps extends ToolbarIconButtonProps {
  readonly children?: ReactNode
}

export const SubMenuButton = forwardRef<PopoverProps, SubMenuButtonProps>(
  ({children, icon}, ref) => {
    // The Submenu buttons provides some local context to it's children.
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const localRef = useRef<PopoverProps>(null)
    // Optional forwarding ref from parent, else use local ref.
    const triggerRef = (ref || localRef) as typeof localRef

    const closeMenu = () => {
      triggerRef.current!.close()
    }

    const openMenu = () => {
      triggerRef.current!.open()
    }

    const menuRef = useCallback((node: any) => {
      setIsMenuOpen(!!node)
    }, [])

    const menu = <Popover ref={menuRef}>{children}</Popover>

    return (
      <SubMenuContext.Provider
        value={{
          closeMenu,
          openMenu
        }}>
        <Whisper placement="top" speaker={menu} ref={triggerRef} trigger="none">
          <ToolbarButton
            active={isMenuOpen}
            onMouseDown={e => {
              e.preventDefault()
              isMenuOpen ? closeMenu() : openMenu()
            }}>
            <Icon
              style={{
                minWidth: '15px' // width of close icon (14px) so that element does not change size as long as the provided icon is < 15px.
              }}
              icon={isMenuOpen ? 'close' : icon}
            />
          </ToolbarButton>
        </Whisper>
      </SubMenuContext.Provider>
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
