import './emojiPicker.less'

import styled from '@emotion/styled'
import {BaseEmoji, Picker} from 'emoji-mart'
import {useContext} from 'react'
import {MdClose} from 'react-icons/md'
import {Col as RCol, IconButton, Row} from 'rsuite'

import {SubMenuContext} from './toolbar'

interface EmojiPickerProps {
  setEmoji: (emoji: string) => void
}

const Col = styled(RCol)`
  text-align: right;
  margin-top: 0px;
  margin-bottom: 10px;
`

export function EmojiPicker({setEmoji}: EmojiPickerProps) {
  const {closeMenu} = useContext(SubMenuContext)

  return (
    <>
      <Row>
        <Col xs={24}>
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
