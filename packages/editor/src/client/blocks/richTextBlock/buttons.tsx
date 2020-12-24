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
} from '../../atoms/toolbar'
import {isFormatActive, toggleFormat} from './editorUtils'
import {Format} from './formats'

interface SlateBlockIconButtonProps extends ToolbarIconButtonProps {
  readonly format: Format
}

export function FormatIconButton({icon, format}: SlateBlockIconButtonProps) {
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

interface SlateBlockButtonProps extends ToolbarButtonProps {
  readonly format: Format
}

export function FormatButton({format, children}: SlateBlockButtonProps) {
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

interface SlateSubMenuButtonProps extends SubMenuButtonProps {
  editorHasFocus: boolean
}

export function SlateSubMenuButton({editorHasFocus, children, ...props}: SlateSubMenuButtonProps) {
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
