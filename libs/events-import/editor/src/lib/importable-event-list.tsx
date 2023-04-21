import {ApolloError} from '@apollo/client'
import {Event} from '@wepublish/editor/api'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {IconButton, Message, Pagination, Table as RTable, toaster} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {useImportedEventListQuery} from '@wepublish/editor/api-v2'
import {getApiClientV2} from '../apiClientv2'

import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES
} from '@wepublish/ui/editor'

const {Column, HeaderCell, Cell} = RTable

export function EventStartsAtView({startsAt}: {startsAt: string}) {
  const startsAtDate = new Date(startsAt)
  const {t} = useTranslation()

  return <>{t('event.list.startsAt', {startsAt: startsAtDate})}</>
}

export function EventEndsAtView({endsAt}: {endsAt: string | null | undefined}) {
  const endsAtDate = endsAt ? new Date(endsAt) : undefined
  const {t} = useTranslation()

  if (endsAt) {
    return <>{t('event.list.endsAt', {endsAt: endsAtDate})}</>
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
  const {t} = useTranslation()
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const {data, loading} = useImportedEventListQuery({
    client,
    fetchPolicy: 'no-cache',
    variables: {
      take: limit,
      skip: (page - 1) * limit
    },
    onError: onErrorToast
  })

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('importableEvent.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight loading={loading} data={data?.importedEvents.nodes || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <Link to={`/importableevents/edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </Cell>
          </Column>

          <Column width={250} resizable>
            <HeaderCell>{t('event.list.startsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventStartsAtView startsAt={rowData.startsAt} />}
            </Cell>
          </Column>

          <Column width={250} resizable>
            <HeaderCell>{t('event.list.endsAt')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => <EventEndsAtView endsAt={rowData.endsAt} />}
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

// todo
// const CheckedPermissionComponent = createCheckedPermissionComponent([
//   'CAN_GET_EVENT',
//   'CAN_CREATE_EVENT',
//   'CAN_UPDATE_EVENT',
//   'CAN_DELETE_EVENT'
// ])(ImportableEventListView)

// export {CheckedPermissionComponent as ImportableEventListView}

export {ImportableEventListView}
