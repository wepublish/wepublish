import React, {useState} from 'react'

import {
  PanelHeader,
  Panel,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  NavigationButton,
  TextInput,
  Spacing,
  Box,
  Typography
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconCheck,
  MaterialIconQueryBuilder,
  MaterialIconUpdate
} from '@karma.run/icons'
import {PageMetadata} from './pageMetadataPanel'
import {dateTimeLocalString} from '../utility'

import {useTranslation} from 'react-i18next'

export interface PublishPagePanelProps {
  initialPublishDate?: Date
  pendingPublishDate?: Date
  metadata: PageMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date): void
}

export function PublishPagePanel({
  initialPublishDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishPagePanelProps) {
  const now = new Date()

  const [publishDateString, setPublishDateString] = useState(
    initialPublishDate ? dateTimeLocalString(initialPublishDate) : dateTimeLocalString(now)
  )

  const [updateDateString, setUpdateDateString] = useState(dateTimeLocalString(now))

  const [publishDateError, setPublishDateError] = useState<string>()
  const [updateDateError, setUpdateDateError] = useState<string>()

  const [publishDate, setPublishDate] = useState<Date | undefined>(initialPublishDate ?? now)
  const [updateDate, setUpdateDate] = useState<Date | undefined>(now)

  const {t} = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('pageEditor.panels.publishPage')}
        leftChildren={
          <NavigationButton
            icon={MaterialIconClose}
            label={t('pageEditor.panels.close')}
            onClick={() => onClose()}
          />
        }
        rightChildren={
          <NavigationButton
            icon={MaterialIconCheck}
            label={t('pageEditor.panels.confirm')}
            disabled={!publishDate || !updateDate}
            onClick={() => onConfirm(publishDate!, updateDate!)}
          />
        }
      />
      <PanelSection>
        {pendingPublishDate && (
          <Box marginBottom={Spacing.Small}>
            <Typography variant="subtitle1" color="alert">
              {t('pageEditor.panels.pagePending', {pendingPublishDate})}
            </Typography>
          </Box>
        )}
        <TextInput
          type="datetime-local"
          label={t('pageEditor.panels.publishDate')}
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
              setPublishDateError(t('pageEditor.panels.invalidDate'))
              setPublishDate(undefined)
            }

            setPublishDateString(value)
          }}
        />
        <TextInput
          type="datetime-local"
          label={t('pageEditor.panels.updateDate')}
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
              setUpdateDateError('pageEditor.panels.invalidDate')
              setUpdateDate(undefined)
            }

            setUpdateDateString(value)
          }}
        />
      </PanelSection>
      <PanelSection>
        <DescriptionList>
          <DescriptionListItem label={t('pageEditor.panels.title')}>
            {metadata.title}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.description')}>
            {metadata.description}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.slug')}>
            {metadata.slug}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.tags')}>
            {metadata.tags.join(', ')}
          </DescriptionListItem>
        </DescriptionList>
      </PanelSection>
    </Panel>
  )
}
