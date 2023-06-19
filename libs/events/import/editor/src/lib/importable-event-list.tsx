import {format as formatDate} from 'date-fns'
import {ApolloError} from '@apollo/client'
import {Event} from '@wepublish/editor/api'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Message, Pagination, Table as RTable, toaster, Button} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {
  useImportedEventListQuery,
  useCreateEventMutation,
  useImportedEventsIdsQuery
} from '@wepublish/editor/api-v2'
import {getApiClientV2} from '../apiClientv2'

import {
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  createCheckedPermissionComponent
} from '@wepublish/ui/editor'
import styled from '@emotion/styled'
import {useNavigate} from 'react-router-dom'

const {Column, HeaderCell, Cell: RCell} = RTable

const Cell = styled(RCell)`
  .rs-table-cell-content {
    display: flex;
    align-items: center;
  }
`

export function EventStartsAtView({startsAt}: {startsAt: string}) {
  const startsAtDate = new Date(startsAt)
  return <span>{formatDate(startsAtDate, 'PPP p')}</span>
}

export function EventEndsAtView({endsAt}: {endsAt: string | null | undefined}) {
  const endsAtDate = endsAt ? new Date(endsAt) : undefined
  const {t} = useTranslation()

  if (endsAtDate) {
    return <span>{formatDate(endsAtDate, 'PPP p')}</span>
  }
  return <>{t('event.list.endsAtNone')}</>
}

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error?.message}
      </Message>
    )
  }
}

function ImportableEventListView() {
  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const {data, loading: queryLoading} = useImportedEventListQuery({
    client,
    fetchPolicy: 'no-cache',
    variables: {
      take: limit,
      skip: (page - 1) * limit
    },
    onError: onErrorToast
  })

  const [createEvent, {loading: mutationLoading}] = useCreateEventMutation({
    client,
    onCompleted: data => {
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('toast.createdSuccess')}
        </Message>
      )
      navigate(`/events/edit/${data.createEvent}`)
    },
    onError: onErrorToast
  })

  const {data: ids} = useImportedEventsIdsQuery({
    fetchPolicy: 'no-cache'
  })
  const alreadyImported = ids?.importedEventsIds

  const importEvent = async (id: string, source: string) => {
    createEvent({variables: {filter: {id, source}}})
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('importableEvent.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          rowHeight={60}
          loading={queryLoading || mutationLoading}
          data={data?.importedEvents.nodes || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>{(rowData: RowDataType<Event>) => rowData.name}</Cell>
          </Column>

          <Column width={220} resizable>
            <HeaderCell>{t('event.list.startsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventStartsAtView startsAt={rowData.startsAt} />}
            </Cell>
          </Column>

          <Column width={220} resizable>
            <HeaderCell>{t('event.list.endsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventEndsAtView endsAt={rowData.endsAt} />}
            </Cell>
          </Column>

          <Column width={150} resizable>
            <HeaderCell>{t('event.list.source')}</HeaderCell>
            <Cell>{(rowData: RowDataType<Event>) => rowData.externalSourceName}</Cell>
          </Column>

          <Column width={150} resizable>
            <HeaderCell>{t('event.list.source')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) =>
                alreadyImported && alreadyImported.includes(rowData.id) ? (
                  <Button appearance="ghost" disabled>
                    {t('importableEvent.imported')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => importEvent(rowData.id, rowData.externalSourceName)}
                    appearance="primary">
                    {t('importableEvent.import')}
                  </Button>
                )
              }
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.importedEvents?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_EVENT',
  'CAN_CREATE_EVENT',
  'CAN_UPDATE_EVENT',
  'CAN_DELETE_EVENT'
])(ImportableEventListView)

export {CheckedPermissionComponent as ImportableEventListView}
