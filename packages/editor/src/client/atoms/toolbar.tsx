import React, {
  ReactNode,
  forwardRef,
  ButtonHTMLAttributes,
  useCallback,
  useRef,
  useState,
  createContext
} from 'react'

import {Icon, Popover, PopoverProps, Whisper, Divider} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

import './toolbar.less'

export interface ToolbarProps {
  readonly handleToolbarClick?: () => void
  readonly fadeOut?: boolean
  readonly children?: ReactNode
}

export function Toolbar({handleToolbarClick, fadeOut = false, children}: ToolbarProps) {
  return (
    <div
      onClick={handleToolbarClick}
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
  function ToolbarButton({active, children, ...props}, ref) {
    return (
      <button
        className="icon-button"
        style={{
          border: `${active ? 'blue' : 'transparent'} 1px solid`
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

export function SubMenuButton({children, icon}: ToolbarButtonProps & ToolbarIconButtonProps) {
  /**
   * The Submenu buttons provides some local context to it's children. For
   * now this is only used to enable menu.close() handle from the child tableMenu.
   * Couldb be little overkill only for the table menu, but probably there will be
   * more usecases.
   */
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const triggerRef = useRef<PopoverProps>(null)

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

export function ToolbarDivider() {
  return <Divider style={{height: '1.5em'}} vertical />
}

interface FlexHDivProps {
  children: ReactNode
  dividerTop?: boolean
  dividerBottom?: boolean
}

export function HBar({children, dividerTop, dividerBottom}: FlexHDivProps) {
  return (
    <div style={{width: '100%'}}>
      {dividerTop && <Divider />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%'
        }}>
        {children}
      </div>
      {dividerBottom && <Divider />}
    </div>
  )
}
