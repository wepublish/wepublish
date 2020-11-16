import React, {forwardRef, ButtonHTMLAttributes, useState, useRef} from 'react'
import {useSlate} from 'slate-react'

import {Icon, Popover, Whisper} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

import 'emoji-mart/css/emoji-mart.css'
import './emojiButton.less'
import {Picker, BaseEmoji} from 'emoji-mart'

export interface EmojiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly iconActive?: IconNames | SVGIcon
  readonly active?: boolean
}

export const BaseEmojiButton = forwardRef<HTMLButtonElement, EmojiButtonProps>(
  function BaseEmojiButton({icon, iconActive, active, ...props}, ref) {
    icon = iconActive && active ? iconActive : icon
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
        <Icon icon={icon} element={icon} />
      </button>
    )
  }
)

export function EmojiButton({icon, iconActive}: EmojiButtonProps) {
  const editor = useSlate()
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  const triggerRef = useRef<any>(null)

  const open = () => {
    if (triggerRef.current) {
      triggerRef.current!.open()
      // TODO rather be done with forwardRef ?
      setIsEmojiPickerOpen(true)
    }
  }
  const close = () => {
    if (triggerRef.current) {
      triggerRef.current!.close()
      setIsEmojiPickerOpen(false)
    }
  }

  const emojiPicker = (
    <Popover>
      <Picker
        onSelect={({native}: BaseEmoji) => {
          editor.insertText(native)
        }}
      />
    </Popover>
  )

  return (
    <div>
      <Whisper placement="top" speaker={emojiPicker} ref={triggerRef} trigger="none">
        <BaseEmojiButton
          icon={isEmojiPickerOpen ? iconActive || icon : icon}
          active={isEmojiPickerOpen}
          onMouseDown={e => {
            e.preventDefault()
            isEmojiPickerOpen ? close() : open()
          }}
        />
      </Whisper>
    </div>
  )
}
