import './emojiPicker.less'

import {BaseEmoji, Picker} from 'emoji-mart'
import React, {useContext} from 'react'
import {MdClose} from 'react-icons/md'
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
          <IconButton icon={<MdClose />} onClick={() => closeMenu()} />
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
