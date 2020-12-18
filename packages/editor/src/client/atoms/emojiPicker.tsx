import React from 'react'

import './emojiPicker.less'
import {Picker, BaseEmoji} from 'emoji-mart'

interface EmojiPickerProps {
  doWithEmoji: (emoji: string) => void
}

export function EmojiPicker({doWithEmoji}: EmojiPickerProps) {
  return (
    <Picker
      onSelect={({native}: BaseEmoji) => {
        doWithEmoji(native)
      }}
    />
  )
}
