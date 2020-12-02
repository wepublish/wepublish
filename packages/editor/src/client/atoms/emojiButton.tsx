import React, {ButtonHTMLAttributes, useCallback, useRef, useState} from 'react'
import {useSlate} from 'slate-react'

import {Icon, Popover, Whisper} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

import './emojiButton.less'
import {Picker, BaseEmoji} from 'emoji-mart'

export interface EmojiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly iconActive?: IconNames | SVGIcon
}

export function EmojiButton({icon, iconActive}: EmojiButtonProps) {
  const editor = useSlate()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const triggerRef = useRef<any>(null)

  const popOverRef = useCallback((node: any) => {
    setIsPopoverOpen(!!node)
  }, [])

  const emojiPicker = (
    <Popover ref={popOverRef}>
      <Picker
        onSelect={({native}: BaseEmoji) => {
          editor.insertText(native)
        }}
      />
    </Popover>
  )

  return (
    <Whisper placement="top" speaker={emojiPicker} ref={triggerRef} trigger="none">
      <button
        style={{
          border: isPopoverOpen ? 'blue 1px solid' : '',
          fontSize: 16,
          cursor: 'pointer',
          borderRadius: 3,
          backgroundColor: 'transparent',
          padding: 2
        }}
        onMouseDown={e => {
          e.preventDefault()
          !isPopoverOpen ? triggerRef.current!.open() : triggerRef.current!.close()
        }}>
        <Icon icon={isPopoverOpen && iconActive ? iconActive : icon} />
      </button>
    </Whisper>
  )
}
