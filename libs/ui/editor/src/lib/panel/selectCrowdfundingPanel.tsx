import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer, Message, Table, toaster} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {CrowdfundingBlockValue} from '../blocks'
import {
  Crowdfunding,
  useCrowdfundingsLazyQuery,
  useCrowdfundingsQuery
} from '@wepublish/editor/api-v2'

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error?.message}
      </Message>
    )
  }
}

export type SelectCrowdfundingPanelProps = {
  selectedCrowdfunding: CrowdfundingBlockValue['crowdfunding'] | null | undefined
  onClose(): void
  onSelect(crowdfunding: CrowdfundingBlockValue['crowdfunding'] | null | undefined): void
}

export function SelectCrowdfundingPanel({
  selectedCrowdfunding,
  onClose,
  onSelect
}: SelectCrowdfundingPanelProps) {
  const {t} = useTranslation()

  const {data, loading} = useCrowdfundingsQuery({
    onError: onErrorToast,
    fetchPolicy: 'cache-and-network'
  })

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.crowdfunding.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'ghost'} onClick={() => onClose()}>
            {t('close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <Table
          minHeight={600}
          autoHeight
          loading={loading}
          data={data?.crowdfundings || []}
          rowClassName={rowData =>
            rowData?.id === selectedCrowdfunding?.id ? 'highlighted-row' : ''
          }>
          <Table.Column resizable>
            <Table.HeaderCell>{t('crowdfundingList.id')}</Table.HeaderCell>
            <Table.Cell>{(rowData: RowDataType<Crowdfunding>) => rowData.id}</Table.Cell>
          </Table.Column>

          <Table.Column resizable width={200}>
            <Table.HeaderCell>{t('crowdfundingList.name')}</Table.HeaderCell>
            <Table.Cell>{(rowData: RowDataType<Crowdfunding>) => rowData.name}</Table.Cell>
          </Table.Column>
        </Table>
      </DrawerBody>
    </>
  )
}
