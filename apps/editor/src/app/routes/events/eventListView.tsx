import {ApolloError} from '@apollo/client'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Button, FlexboxGrid, IconButton, Message, Pagination, Table, toaster} from 'rsuite'
import {RowDataType} from 'rsuite-table'

import {Event, useEventListQuery} from '../../api'
import {createCheckedPermissionComponent, PermissionControl} from '../../atoms/permissionControl'
import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../../utility'
import {DeleteEventModal} from './deleteEventModal'

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

function EventListView() {
  const {t} = useTranslation()
  const [eventDelete, setEventDelete] = useState<Event | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const {data, loading, refetch} = useEventListQuery({
    fetchPolicy: 'no-cache',
    variables: {
      take: limit,
      skip: (page - 1) * limit
    },
    onError: onErrorToast
  })

  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit
    })
  }, [page, limit])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('event.list.title')}</h2>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right', alignSelf: 'center'}}>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_EVENT']}>
            <Link to="create">
              <Button appearance="primary">{t('event.list.create')}</Button>
            </Link>
          </PermissionControl>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item style={{marginTop: '20px'}} colspan={24}>
          <Table minHeight={600} autoHeight loading={loading} data={data?.events?.nodes || []}>
            <Table.Column width={200} resizable>
              <Table.HeaderCell>{t('event.list.name')}</Table.HeaderCell>
              <Table.Cell>
                {(rowData: RowDataType<Event>) => (
                  <>
                    <Link to={`/events/edit/${rowData.id}`}>{rowData.name}</Link>
                  </>
                )}
              </Table.Cell>
            </Table.Column>

            <Table.Column width={250} resizable>
              <Table.HeaderCell>{t('event.list.startsAt')}</Table.HeaderCell>
              <Table.Cell>
                {(rowData: Event) => <EventStartsAtView startsAt={rowData.startsAt} />}
              </Table.Cell>
            </Table.Column>

            <Table.Column width={250} resizable>
              <Table.HeaderCell>{t('event.list.endsAt')}</Table.HeaderCell>
              <Table.Cell>
                {(rowData: RowDataType<Event>) => <EventEndsAtView endsAt={rowData.endsAt} />}
              </Table.Cell>
            </Table.Column>

            <Table.Column resizable>
              <Table.HeaderCell align={'center'}>{t('event.list.delete')}</Table.HeaderCell>
              <Table.Cell align={'center'} style={{padding: '5px 0'}}>
                {(event: RowDataType<Event>) => (
                  <IconButton
                    icon={<TrashIcon />}
                    circle
                    size="sm"
                    onClick={() => setEventDelete(event)}
                  />
                )}
              </Table.Cell>
            </Table.Column>
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
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <DeleteEventModal
        event={eventDelete}
        onDelete={refetch}
        onClose={() => setEventDelete(undefined)}
      />
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_EVENT',
  'CAN_CREATE_EVENT',
  'CAN_UPDATE_EVENT',
  'CAN_DELETE_EVENT'
])(EventListView)

export {CheckedPermissionComponent as EventListView}
