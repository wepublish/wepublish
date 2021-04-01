import React from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer} from 'rsuite'
import {RefSelectPanel, RefSelectPanelProps} from './refSelectPanel'

export function RefSelectPanelDrawer(props: RefSelectPanelProps) {
  const {t} = useTranslation()
  return (
    <>
      <Drawer.Header>
        <Drawer.Title>Choose a reference</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <RefSelectPanel {...props}></RefSelectPanel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => props.onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
