import React, {useEffect, useState} from 'react'

import {
  Button,
  Divider,
  Placeholder,
  Drawer,
  Dropdown,
  Form,
  FormGroup,
  Icon,
  IconButton,
  Loader,
  Panel,
  Alert
} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {BulkDataType, useUserAndSubscriptionBulkDataLazyQuery} from '../api'

import {useTranslation} from 'react-i18next'

export interface UserExportPanelProps {
  onClose?(): void
}

export function UserExportPanel({onClose}: UserExportPanelProps) {
  const {t} = useTranslation()

  const {Paragraph} = Placeholder

  const [type, setType] = useState<BulkDataType>()

  const [
    getData,
    {loading: isLoading, error: exportError, data}
  ] = useUserAndSubscriptionBulkDataLazyQuery()

  useEffect(() => {
    if (exportError?.message) Alert.error(exportError.message, 0)
  }, [exportError])

  async function handleExport() {
    if (type) {
      await getData({
        variables: {
          type: type
        }
      })
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('userList.panels.exportSubscription')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <DescriptionList>
                <DescriptionListItem label={t('userList.panels.BulkDataType')}>
                  <Dropdown title={type || t('navbar.type')}>
                    <Dropdown.Item onSelect={() => setType(BulkDataType.Csv)}>
                      {BulkDataType.Csv}
                    </Dropdown.Item>
                    <Dropdown.Item onSelect={() => setType(BulkDataType.Json)}>
                      {BulkDataType.Json}
                    </Dropdown.Item>
                  </Dropdown>
                </DescriptionListItem>
              </DescriptionList>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <Button
                  style={{marginBottom: 20, textAlign: 'right'}}
                  disabled={type === undefined}
                  appearance="primary"
                  onClick={() => handleExport()}>
                  {t('userList.panels.exportSubscription')}
                </Button>
              </div>
            </FormGroup>
          </Form>
          <Divider>{t('userList.panels.result')}</Divider>
          {isLoading ? (
            <Paragraph rows={6}>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <Loader center content="Loading" />
            </Paragraph>
          ) : (
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <div style={{wordBreak: 'break-word'}}>{data?.userAndSubscriptionBulkData || ''}</div>
              <IconButton
                disabled={!data?.userAndSubscriptionBulkData}
                onClick={() => navigator.clipboard.writeText(data!.userAndSubscriptionBulkData!)}
                className="collapse-nav-btn"
                appearance="primary"
                size="xs"
                icon={<Icon size="lg" icon={'copy'} />}
              />
            </div>
          )}
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('userList.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
