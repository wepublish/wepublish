import React from 'react'
import {useTranslation} from 'react-i18next'
import {IconButton} from 'rsuite'
import {SubscriptionFilter, useSubscriptionsAsCsvQuery} from '../api'
import {FileDownload} from '@rsuite/icons'

export interface ExportSubscriptionAsCsvProps {
  filter?: SubscriptionFilter
}

export function ExportSubscriptionsAsCsv({filter}: ExportSubscriptionAsCsvProps) {
  const {t} = useTranslation()
  const {data, loading, refetch} = useSubscriptionsAsCsvQuery({
    variables: {
      filter
    },
    fetchPolicy: 'no-cache'
  })

  /**
   * Get blob from string and download it as csv file.
   */
  const downloadBlob = () => {
    const content = data?.subscriptionsAsCsv || ''
    const filename = `${new Date().getTime()}-wep-subscriptions.csv`
    const contentType = 'text/csv;charset=utf-8;'
    const blob = new Blob([content], {type: contentType})
    const url = URL.createObjectURL(blob)
    const pom = document.createElement('a')
    pom.href = url
    pom.setAttribute('download', filename)
    pom.click()
  }

  /**
   * Initialize download by getting data from api and start the blob download
   */
  async function initDownload(): Promise<void> {
    await refetch()
    downloadBlob()
  }

  return (
    <>
      <IconButton
        appearance="primary"
        icon={<FileDownload />}
        disabled={loading}
        onClick={() => initDownload()}>
        {t('subscriptionList.overview.downloadCsv')}
      </IconButton>
    </>
  )
}
