import React from 'react'

import {
  PanelHeader,
  Panel,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  NavigationButton
} from '@karma.run/ui'

import {ArticleMetadata} from './articleMetadataPanel'
import {MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

export interface PublishArticlePanelProps {
  readonly metadata: ArticleMetadata

  onClose(): void
  onConfirm(): void
}

export function PublishArticlePanel({metadata, onClose, onConfirm}: PublishArticlePanelProps) {
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
          <DescriptionListItem label="Pre-title">{metadata.preTitle}</DescriptionListItem>
          <DescriptionListItem label="Title">{metadata.title}</DescriptionListItem>
          <DescriptionListItem label="Lead">{metadata.lead}</DescriptionListItem>
          <DescriptionListItem label="Slug">{metadata.slug}</DescriptionListItem>
          <DescriptionListItem label="Tags">{metadata.tags.join(', ')}</DescriptionListItem>
          <DescriptionListItem label="Breaking News">
            {metadata.breaking ? 'Yes' : 'No'}
          </DescriptionListItem>
          <DescriptionListItem label="Shared with peers">
            {metadata.shared ? 'Yes' : 'No'}
          </DescriptionListItem>
        </DescriptionList>
      </PanelSection>
    </Panel>
  )
}
