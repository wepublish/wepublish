import React from 'react'

import {
  PanelHeader,
  Panel,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  NavigationButton
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'
import {PageMetadata} from './pageMetadataPanel'

export interface PublishPagePanelProps {
  readonly metadata: PageMetadata

  onClose(): void
  onConfirm(): void
}

export function PublishPagePanel({metadata, onClose, onConfirm}: PublishPagePanelProps) {
  return (
    <Panel>
      <PanelHeader
        title="Publish Article"
        leftChildren={
          <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
        }
        rightChildren={
          <NavigationButton icon={MaterialIconCheck} label="Confirm" onClick={() => onConfirm()} />
        }
      />
      <PanelSection>
        <DescriptionList>
          <DescriptionListItem label="Title">{metadata.title}</DescriptionListItem>
          <DescriptionListItem label="Description">{metadata.description}</DescriptionListItem>
          <DescriptionListItem label="Slug">{metadata.slug}</DescriptionListItem>
          <DescriptionListItem label="Tags">{metadata.tags.join(', ')}</DescriptionListItem>
        </DescriptionList>
      </PanelSection>
    </Panel>
  )
}
