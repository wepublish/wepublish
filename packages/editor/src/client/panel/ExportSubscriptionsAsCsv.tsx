import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {IconButton} from 'rsuite'
import {SubscriptionFilter, useSubscriptionsAsCsvLazyQuery} from '../api'
import {FileDownload} from '@rsuite/icons'

export interface ExportSubscriptionAsCsvProps {
  filter?: SubscriptionFilter
  search?: string
}

export function ExportSubscriptionsAsCsv({filter, search}: ExportSubscriptionAsCsvProps) {
  const {t} = useTranslation()
  const [getCsv, {data, loading}] = useSubscriptionsAsCsvLazyQuery({
    variables: {
      filter,
      search
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    getCsv()
  }, [filter])

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

  return (
    <>
      <IconButton
        appearance="primary"
        icon={<FileDownload />}
        disabled={loading}
        onClick={() => downloadBlob()}>
        {t('subscriptionList.overview.downloadCsv')}
      </IconButton>
    </>
  )
}
