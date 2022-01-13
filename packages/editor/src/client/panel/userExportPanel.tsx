import React, {useEffect, useState} from 'react'

import {Button, Drawer, Dropdown, Form, FormGroup, Icon, IconButton, Panel} from 'rsuite'

import {DescriptionListItem} from '../atoms/descriptionList'

import {BulkDataType, useUserAndSubscriptionBulkDataLazyQuery} from '../api'

import {useTranslation} from 'react-i18next'

export interface UserExportPanelProps {
  onClose?(): void
}

export function UserExportPanel({onClose}: UserExportPanelProps) {
  const {t} = useTranslation()

  const [type, setType] = useState<BulkDataType>()

  const [
    getData,
    {loading: isCreating, error: createError, data}
  ] = useUserAndSubscriptionBulkDataLazyQuery()

  useEffect(() => {
    if (type) getData()
  }, [type])

  async function handleExport() {
    if (type) {
      await getData({
        variables: {
          type: type
        }
      })
    }
  }

  console.log(isCreating, createError)

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('userList.panels.exportSubscription')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true} style={{paddingBottom: 40}}>
            <FormGroup>
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
              <Button
                style={{marginBottom: 20}}
                disabled={type === undefined}
                appearance="primary"
                onClick={() => handleExport()}>
                {t('userList.panels.exportSubscription')}
              </Button>
              <DescriptionListItem label={t('userList.panels.result')}>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <IconButton
                    disabled={!data?.userAndSubscriptionBulkData}
                    onClick={() =>
                      navigator.clipboard.writeText(data!.userAndSubscriptionBulkData!)
                    }
                    className="collapse-nav-btn"
                    appearance="primary"
                    size="xs"
                    icon={<Icon size="lg" icon={'copy'} />}
                  />
                </div>
                <div style={{wordBreak: 'break-all'}}>{data?.userAndSubscriptionBulkData}</div>
              </DescriptionListItem>
            </FormGroup>
          </Form>
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
