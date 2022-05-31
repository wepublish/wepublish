import CopyIcon from '@rsuite/icons/legacy/Copy'
import DownloadIcon from '@rsuite/icons/legacy/Download'
import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Divider, IconButton, Message, Placeholder, toaster} from 'rsuite'
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
    if (getSubsErr?.message)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {getSubsErr.message}
        </Message>
      )
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
          icon={<DownloadIcon style={{fontSize: '1.3333em'}} />}
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
          icon={<CopyIcon style={{fontSize: '1.3333em'}} />}
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
