import React, {useEffect, useRef} from 'react'
import {PopoverProps} from 'rsuite'
import {useSlate} from 'slate-react'
import {
  ToolbarIconButtonProps,
  ToolbarButtonProps,
  ToolbarButton,
  ToolbarIconButton,
  SubMenuButton,
  SubMenuButtonProps
} from '../../../atoms/toolbar'
import {isFormatActive, toggleFormat} from '../editor/utils'
import {Format} from '../editor/formats'

interface FormatBlockIconButtonProps extends ToolbarIconButtonProps {
  readonly format: Format
}

export function FormatIconButton({icon, format}: FormatBlockIconButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarIconButton
      icon={icon}
      active={isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        toggleFormat(editor, format)
      }}
    />
  )
}

interface FormatBlockButtonProps extends ToolbarButtonProps {
  readonly format: Format
}

export function FormatButton({format, children}: FormatBlockButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarButton
      active={isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        toggleFormat(editor, format)
      }}>
      {children}
    </ToolbarButton>
  )
}

interface EditorSubMenuButtonProps extends SubMenuButtonProps {
  editorHasFocus: boolean
}

export function EditorSubMenuButton({
  editorHasFocus,
  children,
  ...props
}: EditorSubMenuButtonProps) {
  const triggerRef = useRef<PopoverProps>(null)

  useEffect(() => {
    if (!editorHasFocus && triggerRef.current) triggerRef.current!.close()
  }, [editorHasFocus])

  return (
    <SubMenuButton {...props} ref={triggerRef}>
      {children}
    </SubMenuButton>
  )
}
