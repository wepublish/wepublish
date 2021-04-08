import React from 'react'

// import './emojiPicker.less'
import {Picker, BaseEmoji} from 'emoji-mart'

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
