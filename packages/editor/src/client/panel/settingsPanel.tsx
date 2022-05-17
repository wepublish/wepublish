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
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Drawer.Title>Edit Settings</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <ControlLabel>Setting 1</ControlLabel>
              <Toggle />
            </FormGroup>
            <FormGroup>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <ControlLabel>Setting 2</ControlLabel>
              <Toggle />
            </FormGroup>
          </Form>
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Button appearance={'primary'}>Close</Button>
      </Drawer.Footer>
    </>
  )
}
