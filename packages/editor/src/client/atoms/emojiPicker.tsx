import './emojiPicker.less'

import CloseIcon from '@rsuite/icons/legacy/Close'
import {BaseEmoji, Picker} from 'emoji-mart'
import React from 'react'
import {Col, IconButton, Row} from 'rsuite'

interface EmojiPickerProps {
  setEmoji: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({setEmoji, onClose}: EmojiPickerProps) {
  return (
    <>
      <Row>
        <Col xs={24} style={{textAlign: 'right', marginTop: '0px', marginBottom: '10px'}}>
          <IconButton icon={<CloseIcon />} onClick={() => onClose()} />
        </Col>
      </Row>
      <Picker
        onSelect={({native}: BaseEmoji) => {
          setEmoji(native)
        }}
      />
    </>
  )
}
