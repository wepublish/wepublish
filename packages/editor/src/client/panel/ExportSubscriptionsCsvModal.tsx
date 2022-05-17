import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {toaster, Message, Button, Divider, IconButton, Placeholder} from 'rsuite'

import {useSubscriptionsAsCsvLazyQuery} from '../api'
import CopyIcon from '@rsuite/icons/legacy/Copy'

export function SubscriptionAsCsvModal() {
  const {t} = useTranslation()

  const {Paragraph} = Placeholder

  const [
    getSubsCsv,
    {loading: isSubsLoading, error: getSubsErr, data: subscriptionsCsvData}
  ] = useSubscriptionsAsCsvLazyQuery({
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
          {t('userList.panels.exportSubscriptions')}
        </Button>
      </div>
      <Divider>{t('userList.panels.csvData')}</Divider>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        {isSubsLoading ? (
          <Paragraph rows={6} />
        ) : subscriptionsCsvData?.csv === '' ? (
          t('userList.panels.noUsersWithSubscriptions')
        ) : (
          <div style={{wordBreak: 'break-word', marginRight: 10}}>{subscriptionsCsvData?.csv}</div>
        )}
        <IconButton
          appearance="primary"
          icon={<CopyIcon style={{fontSize: '1.3333em'}} />}
          disabled={!subscriptionsCsvData?.csv}
          onClick={() => navigator.clipboard.writeText(subscriptionsCsvData!.csv!)}
        />
      </div>
    </>
  )
}
