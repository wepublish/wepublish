import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Alert, Button, Divider, Icon, IconButton, Modal, Placeholder} from 'rsuite'

import {useSubscriptionsAsCsvLazyQuery} from '../api'

export function SubscriptionAsCsvModal(props: any) {
  const {isOpen, onHide} = props

  const {t} = useTranslation()

  const {Paragraph} = Placeholder

  const [
    getSubsCsv,
    {loading: isSubsLoading, error: getSubsErr, data: subsCsvData}
  ] = useSubscriptionsAsCsvLazyQuery({
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (getSubsErr?.message) Alert.error(getSubsErr.message, 0)
  }, [getSubsErr])

  return (
    <>
      <Modal show={isOpen} onHide={onHide}>
        <Modal.Header>
          <Modal.Title>{t('userList.panels.exportSubscriptions')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button appearance="primary" onClick={() => getSubsCsv()}>
              {t('userList.panels.exportSubscriptions')}
            </Button>
          </div>
          <Divider>{t('userList.panels.csvData')}</Divider>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            {isSubsLoading ? (
              <Paragraph rows={6} />
            ) : subsCsvData?.csv === '' ? (
              t('userList.panels.noUsersWithSubscriptions')
            ) : (
              <div style={{wordBreak: 'break-word', marginRight: 10}}>{subsCsvData?.csv}</div>
            )}
            <IconButton
              appearance="primary"
              icon={<Icon size="lg" icon="copy" />}
              disabled={!subsCsvData?.csv}
              onClick={() => navigator.clipboard.writeText(subsCsvData!.csv!)}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={onHide} appearance="default">
            {t('userList.panels.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
