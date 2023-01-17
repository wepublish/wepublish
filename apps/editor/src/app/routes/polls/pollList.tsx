import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdDelete} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {FlexboxGrid, IconButton, Message, Pagination, Table as RTable, toaster} from 'rsuite'
import {RowDataType} from 'rsuite-table'

import {Poll, usePollsQuery} from '../../api'
import {createCheckedPermissionComponent} from '../../atoms/permissionControl'
import {CreatePollBtn} from '../../atoms/poll/createPollBtn'
import {DeletePollModal} from '../../atoms/poll/deletePollModal'
import {PollStateIndication} from '../../atoms/poll/pollStateIndication'
import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../../utility'

const {Column, HeaderCell, Cell: RCell} = RTable

const Cell = styled(RCell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`

const FlexItem = styled(FlexboxGrid.Item)`
  text-align: right;
  align-self: center;
`

const FlexItemMarginTop = styled(FlexboxGrid.Item)`
  margin-top: 20px;
`

export function PollOpensAtView({poll}: {poll: Poll}) {
  const now = new Date()
  const opensAt = new Date(poll.opensAt)
  const {t} = useTranslation()

  // poll is open
  if (now.getTime() > opensAt.getTime()) {
    return <>{t('pollList.openedAt', {openedAt: opensAt})}</>
  }

  // poll is waiting to open
  return <>{t('pollList.pollWillOpenAt', {opensAt})}</>
}

export function PollClosedAtView({poll}: {poll: Poll}) {
  const now = new Date()
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined
  const {t} = useTranslation()

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return <>{t('pollList.hasBeenClosedAt', {closedAt})}</>
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
        <FlexItem colspan={8}>
          <CreatePollBtn />
        </FlexItem>

        <FlexItemMarginTop colspan={24}>
          <RTable minHeight={600} autoHeight loading={loading} data={data?.polls?.nodes || []}>
            {/* state */}
            <Column resizable>
              <HeaderCell>{t('pollList.state')}</HeaderCell>
              <RCell>
                {(rowData: RowDataType<Poll>) => (
                  <PollStateIndication closedAt={rowData.closedAt} opensAt={rowData.opensAt} />
                )}
              </RCell>
            </Column>
            {/* question */}
            <Column width={200} resizable>
              <HeaderCell>{t('pollList.question')}</HeaderCell>
              <RCell>
                {(rowData: RowDataType<Poll>) => (
                  <Link to={`/polls/edit/${rowData.id}`}>
                    {rowData.question || t('pollList.noQuestion')}
                  </Link>
                )}
              </RCell>
            </Column>
            {/* opens at */}
            <Column width={300} resizable>
              <HeaderCell>{t('pollList.opensAt')}</HeaderCell>
              <RCell>
                {(rowData: RowDataType<Poll>) => <PollOpensAtView poll={rowData as Poll} />}
              </RCell>
            </Column>
            {/* opens at */}
            <Column width={300} resizable>
              <HeaderCell>{t('pollList.closedAt')}</HeaderCell>
              <RCell>
                {(rowData: RowDataType<Poll>) => <PollClosedAtView poll={rowData as Poll} />}
              </RCell>
            </Column>
            {/* delete */}
            <Column resizable>
              <HeaderCell align={'center'}>{t('pollList.delete')}</HeaderCell>
              <Cell align={'center'}>
                {(poll: RowDataType<Poll>) => (
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    appearance="ghost"
                    color="red"
                    size="sm"
                    onClick={() => setPollDelete(poll as Poll)}
                  />
                )}
              </Cell>
            </Column>
          </RTable>

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
        </FlexItemMarginTop>
      </FlexboxGrid>

      <DeletePollModal
        poll={pollDelete}
        onDelete={refetch}
        onClose={() => setPollDelete(undefined)}
      />
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
