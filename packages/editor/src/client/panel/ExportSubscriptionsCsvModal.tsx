import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Alert, Button, Divider, Icon, IconButton, Placeholder} from 'rsuite'

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

export function SubscriptionAsCsvModal({filter}: {filter?: SubscriptionFilter}) {
  const {t} = useTranslation()

  const {Paragraph} = Placeholder

  const [
    getSubsCsv,
    {loading: isSubsLoading, error: getSubsErr, data: subscriptionsCsvData}
  ] = useSubscriptionsAsCsvLazyQuery({
    variables: {
      filter
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (getSubsErr?.message) Alert.error(getSubsErr.message, 0)
  }, [getSubsErr])

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button appearance="primary" onClick={() => getSubsCsv()}>
          {t('userList.panels.generateCSV')}
        </Button>
      </div>
      <Divider>{t('userList.panels.actions')}</Divider>
      <div style={{display: 'flex', justifyContent: 'space-around'}}>
        <IconButton
          appearance="primary"
          icon={<Icon size="lg" icon="download" />}
          disabled={!subscriptionsCsvData?.subscriptionsAsCsv}
          onClick={() =>
            downloadBlob({
              content: subscriptionsCsvData?.subscriptionsAsCsv || '',
              filename: 'export.csv',
              contentType: 'text/csv;charset=utf-8;'
            })
          }>
          {t('userList.panels.download')}
        </IconButton>
        <IconButton
          appearance="primary"
          icon={<Icon size="lg" icon="copy" />}
          disabled={!subscriptionsCsvData?.subscriptionsAsCsv}
          onClick={() => navigator.clipboard.writeText(subscriptionsCsvData!.subscriptionsAsCsv!)}>
          {t('userList.panels.copy')}
        </IconButton>
      </div>
      <Divider>{t('userList.panels.csvData')}</Divider>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        {isSubsLoading ? (
          <Paragraph rows={6} />
        ) : subscriptionsCsvData?.subscriptionsAsCsv === '' ? (
          t('userList.panels.noUsersWithSubscriptions')
        ) : (
          <div style={{wordBreak: 'break-word', marginRight: 10}}>
            {subscriptionsCsvData?.subscriptionsAsCsv}
          </div>
        )}
      </div>
    </>
  )
}
