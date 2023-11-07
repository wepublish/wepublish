import {ApolloError} from '@apollo/client'
import {Event} from '@wepublish/editor/api'
import {
  ImportedEventFilter,
  useCreateEventMutation,
  useImportedEventListQuery,
  useImportedEventsIdsQuery
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Message, Pagination, Table as RTable, toaster} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {getApiClientV2} from '@wepublish/editor/api-v2'

import styled from '@emotion/styled'
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper,
  createCheckedPermissionComponent
} from '@wepublish/ui/editor'
import {format as formatDate} from 'date-fns'
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
  return <time dateTime={startsAtDate.toISOString()}>{formatDate(startsAtDate, 'PPP p')}</time>
}

export function EventEndsAtView({endsAt}: {endsAt: string | null | undefined}) {
  const endsAtDate = endsAt ? new Date(endsAt) : undefined
  const {t} = useTranslation()

  if (endsAtDate) {
    return <time dateTime={endsAtDate.toISOString()}>{formatDate(endsAtDate, 'PPP p')}</time>
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
  const [filter, setFilter] = useState({} as ImportedEventFilter)
  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const importedEventListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit
  }

  const updateFilter = (filter: ImportedEventFilter) => {
    setFilter(filter)
    setPage(1) // reset page to first
  }

  const {data, loading: queryLoading} = useImportedEventListQuery({
    client,
    fetchPolicy: 'no-cache',
    variables: importedEventListVariables,
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

  const isLoading = queryLoading || mutationLoading

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('importableEvent.title')}</h2>
        </ListViewHeader>
        <ListFilters
          fields={['dates', 'providers', 'name', 'location']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => updateFilter(filter)}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          rowHeight={60}
          loading={isLoading}
          data={data?.importedEvents.nodes || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>{(rowData: RowDataType<Event>) => rowData.name}</Cell>
          </Column>

          <Column width={220} resizable>
            <HeaderCell>{t('event.list.startsAtHeader')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventStartsAtView startsAt={rowData.startsAt} />}
            </Cell>
          </Column>

          <Column width={220} resizable>
            <HeaderCell>{t('event.list.endsAtHeader')}</HeaderCell>
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
