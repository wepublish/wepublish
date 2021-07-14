import React, {useEffect, useRef, useState} from 'react'
import {PopoverProps} from 'rsuite'
import {useSlate} from 'slate-react'
import {
  ToolbarIconButtonProps,
  ToolbarButtonProps,
  ToolbarButton,
  ToolbarIconButton,
  SubMenuButton,
  SubMenuButtonProps,
  TextColorIcon
} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {Format} from '../editor/formats'

interface FormatBlockIconButtonProps extends ToolbarIconButtonProps {
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

export function FormatColor() {
  const editor = useSlate()

  const [color, setColor] = useState<string>()

  const [checkColor, toggleCheckColor] = useState<boolean>(false)

  const textInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const nodes: Array<any> | null = Array.from(
      WepublishEditor.nodes(editor, {
        at: editor.selection ?? undefined,
        match: node => !!node.color
      })
    )
    if (nodes?.length) {
      setColor(nodes[0][0].color)
    }
  }, [checkColor])

  useEffect(() => {
    textInput.current?.click()
  }, [color])

  return (
    <ToolbarButton onClick={() => toggleCheckColor(!checkColor)}>
      <TextColorIcon />
      <input
        ref={textInput}
        type="color"
        value={color}
        onChange={e => {
          const color = e.target.value
          if (color) setColor(color)
          WepublishEditor.changeColor(editor, color)
          toggleCheckColor(!checkColor)
        }}
        style={{width: 0, visibility: 'hidden'}}
      />
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
