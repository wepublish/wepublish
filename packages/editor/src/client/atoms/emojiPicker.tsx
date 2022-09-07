import './emojiPicker.less'

import {BaseEmoji, Picker} from 'emoji-mart'
import React from 'react'

interface EmojiPickerProps {
  setEmoji: (emoji: string) => void
}

export function EmojiPicker({setEmoji}: EmojiPickerProps) {
  return (
    <Picker
      onSelect={({native}: BaseEmoji) => {
        setEmoji(native)
      }}
    />
  )
}
