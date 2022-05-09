import React, {useEffect, useRef} from 'react'
import {useSlate} from 'slate-react'
import {
  ToolbarIconButtonProps,
  ToolbarButtonProps,
  ToolbarButton,
  ToolbarIconButton,
  SubMenuButton,
  SubMenuButtonProps
} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {Format} from '../editor/formats'
import {OverlayTriggerInstance} from 'rsuite/esm/Picker'

interface FormatBlockIconButtonProps extends ToolbarIconButtonProps {
  readonly icon: React.ReactElement
  readonly format: Format
}

export function FormatIconButton({icon, format}: FormatBlockIconButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarIconButton
      icon={icon}
      active={WepublishEditor.isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        WepublishEditor.toggleFormat(editor, format)
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
      active={WepublishEditor.isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        WepublishEditor.toggleFormat(editor, format)
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
  const triggerRef = useRef<OverlayTriggerInstance>(null)

  useEffect(() => {
    if (!editorHasFocus && triggerRef.current) triggerRef.current!.close()
  }, [editorHasFocus])

  return (
    <SubMenuButton {...props} ref={triggerRef}>
      {children}
    </SubMenuButton>
  )
}
