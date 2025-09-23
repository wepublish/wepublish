import styled from '@emotion/styled';
import {
  createContext,
  forwardRef,
  ReactEventHandler,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { MdClose } from 'react-icons/md';
import { Divider, Popover, Whisper } from 'rsuite';
import { OverlayTriggerHandle } from 'rsuite/esm/Picker';
import { useSlate } from 'slate-react';

import { Format } from '../blocks/richTextBlock/editor/formats';
import { WepublishEditor } from '../blocks/richTextBlock/editor/wepublishEditor';

const ToolbarDividerElement = styled(Divider)`
  height: 1.5em;
`;

const ControlsChildrenWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
`;

const Controls = styled.div`
  width: 100%;
`;

const IconWrapper = styled.div`
  width: 18px;
  height: 18px;

  svg {
    width: 18px;
    height: 18px;
    display: block;
  }
`;

const CloseIcon = styled(MdClose)`
  min-width: 15px;
`;

const ToolbarButtonElement = styled.button<{ active: boolean }>`
  border: 1px solid rgba(0, 0, 0, 0);
  background-color: white;
  border-radius: 3px;
  font-size: 18px;
  cursor: pointer;
  border-color: ${({ active }) => (active ? 'blue' : 'white')};
  height: 24px;
  width: 24px;
  margin: 0 1px;
  padding: 2px;
  position: relative;

  svg {
    position: absolute;
    top: 2px;
    left: 2px;
  }
`;

const ChildrenWrapper = styled.div<{ fadeOut: boolean }>`
  display: flex;
  flex-wrap: wrap;
  transition-property: opacity;
  transition-duration: 100ms;
  opacity: ${({ fadeOut }) => (fadeOut ? 0.5 : 1)};
`;

const ToolbarInner = styled.div`
  pointer-events: auto;
  padding: 5px;
  background-color: white;
  border-radius: 6px;
  transition-property: opacity;
  transition-duration: 100ms;
`;

const ToolbarWrapper = styled.div`
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  z-index: 1;
  margin-bottom: 30px;
`;

export interface ToolbarProps {
  readonly onMouseDown?: ReactEventHandler;
  readonly fadeOut?: boolean;
  readonly children?: ReactNode;
}

export function Toolbar({
  onMouseDown,
  fadeOut = false,
  children,
}: ToolbarProps) {
  return (
    <ToolbarWrapper onMouseDown={onMouseDown}>
      <ToolbarInner>
        <ChildrenWrapper fadeOut={fadeOut}>{children}</ChildrenWrapper>
      </ToolbarInner>
    </ToolbarWrapper>
  );
}

interface BaseToolbarButtonProps extends React.ComponentPropsWithRef<'button'> {
  readonly active?: boolean;
}

export interface ToolbarButtonProps extends BaseToolbarButtonProps {
  readonly children?: ReactNode;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ active, children, ...props }, ref) => {
    return (
      <ToolbarButtonElement
        type="button"
        active={!!active}
        ref={ref}
        {...props}
      >
        {children}
      </ToolbarButtonElement>
    );
  }
);

export interface ToolbarIconButtonProps extends BaseToolbarButtonProps {
  readonly icon: React.ReactElement;
}

export function ToolbarIconButton({
  icon,
  active,
  ...props
}: ToolbarIconButtonProps) {
  return (
    <ToolbarButton
      active={active}
      {...props}
    >
      {icon}
    </ToolbarButton>
  );
}

interface SubMenuContextProps {
  closeMenu: () => void;
  openMenu: () => void;
}

const emtpyFn = () => {
  /* do nothing */
};

export const SubMenuContext = createContext<SubMenuContextProps>({
  closeMenu: emtpyFn,
  openMenu: emtpyFn,
});

export interface SubMenuButtonProps extends ToolbarIconButtonProps {
  readonly children?: ReactNode;
  readonly format?: Format;
}

export const SubMenuButton = forwardRef<
  OverlayTriggerHandle,
  SubMenuButtonProps
>(({ children, icon, format }, ref) => {
  // The Submenu buttons provides some local context to it's children.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const localRef = useRef<OverlayTriggerHandle>(null);
  // Optional forwarding ref from parent, else use local ref.
  const triggerRef = (ref || localRef) as typeof localRef;

  const closeMenu = () => {
    triggerRef.current!.close();
  };

  const openMenu = () => {
    triggerRef.current!.open();
  };

  const menuRef = useCallback((node: any) => {
    setIsMenuOpen(!!node);
  }, []);

  const menu = <Popover ref={menuRef}>{children}</Popover>;

  const editor = useSlate();

  return (
    <SubMenuContext.Provider
      value={{
        closeMenu,
        openMenu,
      }}
    >
      <Whisper
        placement="top"
        speaker={menu}
        ref={triggerRef}
        trigger="none"
      >
        <ToolbarButton
          active={
            isMenuOpen ||
            (format ? WepublishEditor.isFormatActive(editor, format) : false)
          }
          onMouseDown={e => {
            e.preventDefault();
            isMenuOpen ? closeMenu() : openMenu();
          }}
        >
          {isMenuOpen ?
            <CloseIcon />
          : <IconWrapper>{icon}</IconWrapper>}
        </ToolbarButton>
      </Whisper>
    </SubMenuContext.Provider>
  );
});

export function ToolbarDivider() {
  return <ToolbarDividerElement vertical />;
}

interface ControlsContainerProps {
  children: ReactNode;
  dividerTop?: boolean;
  dividerBottom?: boolean;
}

export function ControlsContainer({
  children,
  dividerTop,
  dividerBottom,
}: ControlsContainerProps) {
  // TODO find rsuite component
  return (
    <Controls>
      {dividerTop && <Divider />}
      <ControlsChildrenWrapper>{children}</ControlsChildrenWrapper>
      {dividerBottom && <Divider />}
    </Controls>
  );
}

export function H1Icon() {
  // from https://icons.getbootstrap.com/
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      className="bi bi-type-h1"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.637 13V3.669H7.379V7.62H2.758V3.67H1.5V13h1.258V8.728h4.62V13h1.259zm5.329 0V3.669h-1.244L10.5 5.316v1.265l2.16-1.565h.062V13h1.244z" />
    </svg>
  );
}

export function H2Icon() {
  // from https://icons.getbootstrap.com/
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      className="bi bi-type-h2"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.638 13V3.669H6.38V7.62H1.759V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.022-6.733v-.048c0-.889.63-1.668 1.716-1.668.957 0 1.675.608 1.675 1.572 0 .855-.554 1.504-1.067 2.085l-3.513 3.999V13H15.5v-1.094h-4.245v-.075l2.481-2.844c.875-.998 1.586-1.784 1.586-2.953 0-1.463-1.155-2.556-2.919-2.556-1.941 0-2.966 1.326-2.966 2.74v.049h1.223z" />
    </svg>
  );
}

export function H3Icon() {
  // from https://icons.getbootstrap.com/
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      className="bi bi-type-h3"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.625-4.272h1.018c1.142 0 1.935.67 1.949 1.674.013 1.005-.78 1.737-2.01 1.73-1.08-.007-1.853-.588-1.935-1.32H9.108c.069 1.327 1.224 2.386 3.083 2.386 1.935 0 3.343-1.155 3.309-2.789-.027-1.51-1.251-2.16-2.037-2.249v-.068c.704-.123 1.764-.91 1.723-2.229-.035-1.353-1.176-2.4-2.954-2.385-1.873.006-2.857 1.162-2.898 2.358h1.196c.062-.69.711-1.299 1.696-1.299.998 0 1.695.622 1.695 1.525.007.922-.718 1.592-1.695 1.592h-.964v1.074z" />
    </svg>
  );
}
