import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Alert, Icon, IconButton} from 'rsuite'

import {SubscriptionFilter, useSubscriptionsAsCsvLazyQuery} from '../api'

type ExportAsFile = {
  content: string
  filename: string
  contentType: string
}

const downloadBlob = ({content, filename, contentType}: ExportAsFile) => {
  const blob = new Blob([content], {type: contentType})
  const url = URL.createObjectURL(blob)
  const pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}

export function ExportSubscriptionsAsCsv({filter}: {filter?: SubscriptionFilter}) {
  const {t} = useTranslation()
  const [
    getSubsCsv,
    {loading, error: getSubsErr, data: subscriptionsCsvData}
  ] = useSubscriptionsAsCsvLazyQuery({
    variables: {
      filter
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (getSubsErr?.message) Alert.error(getSubsErr.message, 0)
  }, [getSubsErr])

  async function downloadCsv() {
    await getSubsCsv()
    downloadBlob({
      content: subscriptionsCsvData?.subscriptionsAsCsv || '',
      filename: 'export.csv',
      contentType: 'text/csv;charset=utf-8;'
    })
  }

  return (
    <>
      <IconButton
        appearance="primary"
        icon={<Icon size="lg" icon="download" />}
        loading={loading}
        onClick={() => downloadCsv()}>
        {t('subscriptionList.overview.downloadCsv')}
      </IconButton>
    </>
  )
}
