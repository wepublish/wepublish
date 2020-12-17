import React from 'react'

import './emojiPicker.less'
import {Picker, BaseEmoji} from 'emoji-mart'

interface EmojiPickerProps {
  withEmoji: (emoji: string) => void
}

export function EmojiPicker({withEmoji}: EmojiPickerProps) {
  return (
    <Picker
      onSelect={({native}: BaseEmoji) => {
        withEmoji(native)
      }}
    />
  )
}
