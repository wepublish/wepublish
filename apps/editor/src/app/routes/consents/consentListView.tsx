import {ApolloError} from '@apollo/client'
// import {RowDataType} from 'rsuite-table'
import {ConsentList} from '@wepublish/consent/editor'
// import {Event, useEventListQuery} from '@wepublish/editor/api'
// import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
// import {MdAdd, MdDelete} from 'react-icons/md'
// import {Link} from 'react-router-dom'
import {Message, toaster} from 'rsuite'

// import {createCheckedPermissionComponent, PermissionControl} from '../../atoms/permissionControl'
// import {
//   ListViewActions,
//   ListViewContainer,
//   ListViewHeader,
//   Table,
//   TableWrapper
// } from '@wepublish/ui/editor'
// import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../../utility'
// import {DeleteEventModal} from './deleteEventModal'

// const {Column, HeaderCell, Cell} = RTable

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error?.message}
      </Message>
    )
  }
}

function ConsentListView() {
  const {t} = useTranslation()
  // const [eventDelete, setEventDelete] = useState<Event | undefined>(undefined)
  // const [page, setPage] = useState<number>(1)
  // const [limit, setLimit] = useState<number>(10)

  // const {data, loading, refetch} = useEventListQuery({
  //   fetchPolicy: 'no-cache',
  //   variables: {
  //     take: limit,
  //     skip: (page - 1) * limit
  //   },
  //   onError: onErrorToast
  // })

  // useEffect(() => {
  //   refetch({
  //     take: limit,
  //     skip: (page - 1) * limit
  //   })
  // }, [page, limit])

  return (
    <>
      <ConsentList />
      {/* <ListViewContainer>
        <ListViewHeader>
          <h2>{t('event.list.title')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_EVENT']}>
          <ListViewActions>
            <Link to="create">
              <IconButton appearance="primary" icon={<MdAdd />}>
                {t('event.list.create')}
              </IconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight loading={loading} data={data?.events?.nodes || []}>
          <Column width={200} resizable>
            <HeaderCell>{t('event.list.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Event>) => (
                <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
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

          <Column resizable>
            <HeaderCell align={'center'}>{t('event.list.delete')}</HeaderCell>
            <Cell align={'center'} style={{padding: '5px 0'}}>
              {(event: RowDataType<Event>) => (
                <IconButton
                  icon={<MdDelete />}
                  color="red"
                  appearance="ghost"
                  circle
                  size="sm"
                  onClick={() => setEventDelete(event as Event)}
                />
              )}
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
          total={data?.events?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      <DeleteEventModal
        event={eventDelete}
        onDelete={refetch}
        onClose={() => setEventDelete(undefined)}
      /> */}
    </>
  )
}

// const CheckedPermissionComponent = createCheckedPermissionComponent([
//   'CAN_GET_EVENT',
//   'CAN_CREATE_EVENT',
//   'CAN_UPDATE_EVENT',
//   'CAN_DELETE_EVENT'
// ])(EventListView)

// export {CheckedPermissionComponent as EventListView}

export {ConsentListView}
