import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Icon, IconButton} from 'rsuite'
import {SubscriptionFilter, useSubscriptionsAsCsvLazyQuery} from '../api'

export function ExportSubscriptionsAsCsv({filter}: {filter?: SubscriptionFilter}) {
  const {t} = useTranslation()
  const [getCsv, {data, loading}] = useSubscriptionsAsCsvLazyQuery({
    variables: {
      filter
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
        icon={<Icon size="lg" icon="download" />}
        disabled={loading}
        onClick={() => downloadBlob()}>
        {t('subscriptionList.overview.downloadCsv')}
      </IconButton>
    </>
  )
}
