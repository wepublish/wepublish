import React, {useState} from 'react'

import {
  PanelHeader,
  Panel,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  NavigationButton,
  TextInput,
  PanelSectionHeader,
  Spacing,
  Box,
  Typography
} from '@karma.run/ui'

import {ArticleMetadata} from './articleMetadataPanel'
import {
  MaterialIconClose,
  MaterialIconCheck,
  MaterialIconUpdate,
  MaterialIconQueryBuilder
} from '@karma.run/icons'
import {dateTimeLocalString} from '../utility'

export interface PublishArticlePanelProps {
  initialPublishDate?: Date
  pendingPublishDate?: Date
  metadata: ArticleMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date): void
}

export function PublishArticlePanel({
  initialPublishDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishArticlePanelProps) {
  const now = new Date()

  const [publishDateString, setPublishDateString] = useState(
    initialPublishDate ? dateTimeLocalString(initialPublishDate) : dateTimeLocalString(now)
  )

  const [updateDateString, setUpdateDateString] = useState(dateTimeLocalString(now))

  const [publishDateError, setPublishDateError] = useState<string>()
  const [updateDateError, setUpdateDateError] = useState<string>()

  const [publishDate, setPublishDate] = useState<Date | undefined>(initialPublishDate ?? now)
  const [updateDate, setUpdateDate] = useState<Date | undefined>(now)

  return (
    <Panel>
      <PanelHeader
        title="Publish Article"
        leftChildren={
          <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
        }
        rightChildren={
          <NavigationButton
            icon={MaterialIconCheck}
            label="Confirm"
            disabled={!publishDate || !updateDate}
            onClick={() => onConfirm(publishDate!, updateDate!)}
          />
        }
      />
      <PanelSection>
        {pendingPublishDate && (
          <Box marginBottom={Spacing.Small}>
            <Typography variant="subtitle1" color="alert">
              There is already a pending publication scheduled at{' '}
              {pendingPublishDate.toLocaleDateString()} {pendingPublishDate.toLocaleTimeString()}{' '}
              publishing again will override that publication.
            </Typography>
          </Box>
        )}
        <TextInput
          type="datetime-local"
          label="Publish Date"
          errorMessage={publishDateError}
          icon={MaterialIconQueryBuilder}
          marginBottom={Spacing.Small}
          value={publishDateString}
          onChange={e => {
            const value = e.target.value
            const publishDate = new Date(value)

            if (!isNaN(publishDate.getTime())) {
              setPublishDateError('')
              setPublishDate(publishDate)
            } else {
              setPublishDateError('Invalid Date')
              setPublishDate(undefined)
            }

            setPublishDateString(value)
          }}
        />
        <TextInput
          type="datetime-local"
          label="Update Date"
          errorMessage={updateDateError}
          icon={MaterialIconUpdate}
          value={updateDateString}
          onChange={e => {
            const value = e.target.value
            const updateDate = new Date(value)

            if (!isNaN(updateDate.getTime())) {
              setPublishDateError('')
              setUpdateDate(updateDate)
            } else {
              setUpdateDateError('Invalid Date')
              setUpdateDate(undefined)
            }

            setUpdateDateString(value)
          }}
        />
      </PanelSection>

      <PanelSectionHeader title="Metadata" />
      <PanelSection>
        <DescriptionList>
          <DescriptionListItem label="Pre-title">{metadata.preTitle || '-'}</DescriptionListItem>
          <DescriptionListItem label="Title">{metadata.title || '-'}</DescriptionListItem>
          <DescriptionListItem label="Lead">{metadata.lead || '-'}</DescriptionListItem>
          <DescriptionListItem label="Slug">{metadata.slug || '-'}</DescriptionListItem>
          <DescriptionListItem label="Tags">{metadata.tags.join(', ') || '-'}</DescriptionListItem>
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
