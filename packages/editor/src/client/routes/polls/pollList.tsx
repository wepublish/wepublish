import {ApolloError} from '@apollo/client'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdDelete} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {FlexboxGrid, IconButton, Message, Pagination, Table, toaster} from 'rsuite'

import {Poll, usePollsQuery} from '../../api'
import {createCheckedPermissionComponent} from '../../atoms/permissionControl'
import {CreatePollBtn} from '../../atoms/poll/createPollBtn'
import {DeletePollModal} from '../../atoms/poll/deletePollModal'
import {PollStateIndication} from '../../atoms/poll/pollStateIndication'
import {dateTimeLocalString, DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../../utility'

export function PollOpensAtView({poll}: {poll: Poll}) {
  const now = new Date()
  const opensAt = new Date(poll.opensAt)
  const opensAtLocalString = dateTimeLocalString(opensAt)
  const {t} = useTranslation()

  // poll is open
  if (now.getTime() > opensAt.getTime()) {
    return <>{t('pollList.openedAt', {openedAt: opensAtLocalString})}</>
  }

  // poll is waiting to open
  return <>{t('pollList.pollWillOpenAt', {opensAt: opensAtLocalString})}</>
}

export function PollClosedAtView({poll}: {poll: Poll}) {
  const now = new Date()
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined
  const {t} = useTranslation()

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    const closedAtLocal = dateTimeLocalString(closedAt)
    return <>{t('pollList.hasBeenClosedAt', {closedAt: closedAtLocal})}</>
  }

  return <>{t('pollList.closedAtNone')}</>
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

function PollList() {
  const {t} = useTranslation()
  const [pollDelete, setPollDelete] = useState<Poll | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  const {data, loading, refetch} = usePollsQuery({
    fetchPolicy: 'no-cache',
    variables: {
      take: limit,
      skip: (page - 1) * limit
    },
    onError: onErrorToast
  })

  /**
   * Refetch data
   */
  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit
    })
  }, [page, limit])

  return (
    <>
      <FlexboxGrid>
        {/* title */}
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('pollList.title')}</h2>
        </FlexboxGrid.Item>

        {/* create new poll */}
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right', alignSelf: 'center'}}>
          <CreatePollBtn />
        </FlexboxGrid.Item>

        <FlexboxGrid.Item style={{marginTop: '20px'}} colspan={24}>
          <Table minHeight={600} autoHeight loading={loading} data={data?.polls?.nodes || []}>
            {/* state */}
            <Table.Column resizable>
              <Table.HeaderCell>{t('pollList.state')}</Table.HeaderCell>
              <Table.Cell>
                {(rowData: Poll) => (
                  <PollStateIndication closedAt={rowData.closedAt} opensAt={rowData.opensAt} />
                )}
              </Table.Cell>
            </Table.Column>
            {/* question */}
            <Table.Column width={200} resizable>
              <Table.HeaderCell>{t('pollList.question')}</Table.HeaderCell>
              <Table.Cell>
                {(rowData: Poll) => (
                  <>
                    <Link to={`/polls/edit/${rowData.id}`}>
                      {rowData.question || t('pollList.noQuestion')}
                    </Link>
                  </>
                )}
              </Table.Cell>
            </Table.Column>
            {/* opens at */}
            <Table.Column width={250} resizable>
              <Table.HeaderCell>{t('pollList.opensAt')}</Table.HeaderCell>
              <Table.Cell>{(rowData: Poll) => <PollOpensAtView poll={rowData} />}</Table.Cell>
            </Table.Column>
            {/* opens at */}
            <Table.Column width={250} resizable>
              <Table.HeaderCell>{t('pollList.closedAt')}</Table.HeaderCell>
              <Table.Cell>{(rowData: Poll) => <PollClosedAtView poll={rowData} />}</Table.Cell>
            </Table.Column>
            {/* delete */}
            <Table.Column resizable>
              <Table.HeaderCell align={'center'}>{t('pollList.delete')}</Table.HeaderCell>
              <Table.Cell align={'center'} style={{padding: '5px 0'}}>
                {(poll: Poll) => (
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    appearance="ghost"
                    color="red"
                    size="sm"
                    onClick={() => setPollDelete(poll)}
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
            total={data?.polls?.totalCount ?? 0}
            activePage={page}
            onChangePage={page => setPage(page)}
            onChangeLimit={limit => setLimit(limit)}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <DeletePollModal poll={pollDelete} afterDelete={refetch} setPoll={setPollDelete} />
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_CREATE_POLL',
  'CAN_UPDATE_POLL',
  'CAN_DELETE_POLL'
])(PollList)
export {CheckedPermissionComponent as PollList}
