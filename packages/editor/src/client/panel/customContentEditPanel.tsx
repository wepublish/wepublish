import React, {useState} from 'react'

import {
  Spacing,
  Panel,
  PanelHeader,
  PanelSection,
  NavigationButton,
  PanelSectionHeader,
  TextInput,
  Select,
  Typography
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'
import {CustomContentFormat} from '../blocks/types'

interface CustomContentData {
  readonly kind: string
  readonly format: string
  readonly height?: number
  readonly width?: number
}

export interface CustomContentEditPanelProps {
  readonly customContentData: CustomContentData

  onClose?(): void
  onSave?(kind: string, format: string, height?: number, width?: number): void
}

export function CustomContentEditPanel({
  customContentData,
  onClose,
  onSave
}: CustomContentEditPanelProps) {
  const [kind, setKind] = useState(customContentData.kind)
  const [format, setFormat] = useState(customContentData.format)
  const [height, setHeight] = useState(customContentData.height)
  const [width, setWidth] = useState(customContentData.width)

  function handleSave() {
    if (onSave) {
      onSave(kind, format, height, width)
    }
  }

  const formatOptions = [
    {
      id: CustomContentFormat.HTML,
      name: 'HTML'
    },
    {
      id: CustomContentFormat.JSON,
      name: 'JSON'
    },
    {
      id: CustomContentFormat.MARKDOWN,
      name: 'MARKDOWN'
    },
    {
      id: CustomContentFormat.Other,
      name: 'Other'
    }
  ]

  return (
    <>
      <Panel>
        <PanelHeader
          title={'Edit Custom Content'}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={'Cancel'}
              onClick={() => onClose?.()}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={'Save'}
              onClick={() => handleSave()}
            />
          }
        />
        <>
          <PanelSectionHeader title="Information" />
          <PanelSection>
            <TextInput
              label="Kind"
              description="Block will only be displayed/rendered if the frontend can handle this kind!"
              value={kind}
              onChange={e => setKind(e.target.value)}
              marginBottom={Spacing.Small}
              required
            />
            <Select
              label="Content Format"
              options={formatOptions}
              value={formatOptions.find(opt => opt.id === format)}
              renderListItem={opt => opt?.name}
              onChange={opt => setFormat(opt ? opt.id : format)}
              marginBottom={Spacing.Small}
            />
            <TextInput
              type="number"
              label="Height"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value))}
              marginBottom={Spacing.Small}
            />
            <TextInput
              type="number"
              label="Width"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value))}
              marginBottom={Spacing.Small}
            />
          </PanelSection>
        </>
      </Panel>
    </>
  )
}
