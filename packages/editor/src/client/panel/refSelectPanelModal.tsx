import React from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Modal} from 'rsuite'
import {RefSelectPanel, RefSelectPanelProps} from './refSelectPanel'

export function RefSelectModal(props: RefSelectPanelProps) {
  const {t} = useTranslation()
  return (
    <>
      <Modal.Header>
        <Modal.Title>Choose a reference</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <RefSelectPanel {...props}></RefSelectPanel>
      </Modal.Body>

      <Modal.Footer>
        <Button appearance={'subtle'} onClick={() => props.onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
