import React, {useState} from 'react'
import {Icon, Nav} from 'rsuite'
import {ContentContextEnum} from '../api'
import {
  ContentModelSchemaFieldRefTypeMap,
  MediaReferenceType,
  Reference
} from '../interfaces/referenceType'
import {RefContentSelectPanel} from './refContentSelectPanel'
import {RefImageSelectPanel} from './refMediaSelectPanel'

export interface RefSelectPanelProps {
  readonly config: ContentModelSchemaFieldRefTypeMap
  onClose(): void
  onSelectRef: (ref: Reference) => void
}

export function RefSelectPanel({onClose, onSelectRef, config}: RefSelectPanelProps) {
  const types = Object.entries(config).map(([type, val]) => {
    return {
      type,
      context: val.scope
    }
  })
  const [tabIndex, setTabIndex] = useState(0)
  const currentType = types[tabIndex]

  const tabs = types.map((type, index) => {
    return (
      <Nav.Item key={index} eventKey={index} icon={<Icon icon="file-text" />}>
        {type.type === MediaReferenceType ? 'media' : type.type}
      </Nav.Item>
    )
  })

  function currentContent(currentType: {type: string; context: ContentContextEnum}) {
    if (currentType.type === MediaReferenceType) {
      return (
        <RefImageSelectPanel
          onSelectRef={onSelectRef}
          onClose={() => {
            /* do nothing */
          }}></RefImageSelectPanel>
      )
    }
    return (
      <RefContentSelectPanel
        onSelectRef={onSelectRef}
        context={currentType.context}
        type={currentType.type}></RefContentSelectPanel>
    )
  }

  return (
    <>
      <Nav
        appearance="tabs"
        activeKey={tabIndex}
        onSelect={tabIndex => setTabIndex(tabIndex)}
        style={{marginBottom: 20}}>
        {tabs}
      </Nav>
      {currentContent(currentType)}
    </>
  )
}
