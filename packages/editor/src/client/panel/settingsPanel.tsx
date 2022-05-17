import React from 'react'

// import {useTranslation} from 'react-i18next'
import {Button, ControlLabel, Drawer, Form, Toggle, FormGroup, Panel} from 'rsuite'
import {useMeQuery} from '../api'

export function SettingsPanel() {
  // check permissions
  const {data} = useMeQuery()
  console.log('data', data?.me?.roles)

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>Edit Settings</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>Setting 1</ControlLabel>
              <Toggle />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Setting 2</ControlLabel>
              <Toggle />
            </FormGroup>
          </Form>
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'}>Close</Button>
      </Drawer.Footer>
    </>
  )
}
