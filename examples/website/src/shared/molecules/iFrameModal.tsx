import React from 'react'

import {Modal} from '../atoms/modalView'
import {cssRule, useStyle} from '@karma.run/react'

const iFrameSyle = cssRule({
  width: '100%',
  height: '97%',
  border: '0px',
  paddingTop: '20px'
})

export interface IFrameModalProps {
  src: string
}

export function IFrameModal({src}: IFrameModalProps) {
  const css = useStyle()

  return (
    <Modal>
      <iframe className={css(iFrameSyle)} src={src}></iframe>
    </Modal>
  )
}
