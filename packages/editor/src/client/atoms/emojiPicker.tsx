import './emojiPicker.less'

import CloseIcon from '@rsuite/icons/legacy/Close'
import {BaseEmoji, Picker} from 'emoji-mart'
import React, {useContext} from 'react'
import {Col, IconButton, Row} from 'rsuite'

import {SubMenuContext} from './toolbar'

interface EmojiPickerProps {
  setEmoji: (emoji: string) => void
}

export function EmojiPicker({setEmoji}: EmojiPickerProps) {
  const {closeMenu} = useContext(SubMenuContext)

  return (
    <>
      <Row>
        <Col xs={24} style={{textAlign: 'right', marginTop: '0px', marginBottom: '10px'}}>
          <IconButton icon={<CloseIcon />} onClick={() => closeMenu()} />
        </Col>
      </Row>
      <Picker
        onSelect={({native}: BaseEmoji) => {
          closeMenu()
          setEmoji(native)
        }}
      />
    </>
  )
}
