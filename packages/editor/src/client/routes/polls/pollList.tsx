import {ApolloError} from '@apollo/client'
import {PlayOutline} from '@rsuite/icons'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import OffIcon from '@rsuite/icons/Off'
import WaitIcon from '@rsuite/icons/Wait'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {FlexboxGrid, IconButton, Message, Pagination, Table, toaster} from 'rsuite'

import {FullPoll, usePollsQuery} from '../../api'
import {CreatePollBtn} from '../../atoms/poll/createPollBtn'
import {DeletePollModal} from '../../atoms/poll/deletePollModal'
import {dateTimeLocalString, DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../../utility'

export function PollList() {
  const {t} = useTranslation()
  const [pollDelete, setPollDelete] = useState<FullPoll | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  /**
   * Handling error on loading polls.
   */
  const onErrorToast = (error: ApolloError) => {
    if (error?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error?.message}
        </Message>
      )
    }
  }

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

  /**
   * UI HELPERS
   */
  function pollStateView(poll: FullPoll) {
    const now = new Date()
    const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined

    // poll has been closed
    if (closedAt && now.getTime() >= closedAt.getTime()) {
      return (
        <>
          <OffIcon style={{color: 'red'}} />
        </>
      )
    }

    // poll is open
    const opensAt = new Date(poll.opensAt)
    if (now.getTime() > opensAt.getTime()) {
      return (
        <>
          <PlayOutline style={{color: 'green'}} />
        </>
      )
    }

    // poll is waiting to be opened
    return (
      <>
        <WaitIcon />
      </>
    )
  }

  function pollOpensAtView(poll: FullPoll) {
    const now = new Date()
    const opensAt = new Date(poll.opensAt)
    const opensAtLocalString = dateTimeLocalString(opensAt)
    // poll is open
    if (now.getTime() > opensAt.getTime()) {
      return <>{t('pollList.openedAt', {openedAt: opensAtLocalString})}</>
    }
    // poll is waiting to open
    return <>{t('pollList.pollWillOpenAt', {opensAt: opensAtLocalString})}</>
  }

  function pollClosedAtView(poll: FullPoll) {
    const now = new Date()
    const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined
    // poll has been closed
    if (closedAt && now.getTime() >= closedAt.getTime()) {
      const closedAtLocal = dateTimeLocalString(closedAt)
      return <>{t('pollList.hasBeenClosedAt', {closedAt: closedAtLocal})}</>
    }

    return <>{t('pollList.closedAtNone')}</>
  }

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

        {/* table */}
        <FlexboxGrid.Item style={{marginTop: '20px'}} colspan={24}>
          <Table minHeight={600} autoHeight loading={loading} data={data?.polls?.nodes || []}>
            {/* state */}
            <Table.Column resizable>
              <Table.HeaderCell>{t('pollList.state')}</Table.HeaderCell>
              <Table.Cell dataKey={'id'}>
                {(rowData: FullPoll) => pollStateView(rowData)}
              </Table.Cell>
            </Table.Column>
            {/* question */}
            <Table.Column width={200} resizable>
              <Table.HeaderCell>{t('pollList.question')}</Table.HeaderCell>
              <Table.Cell dataKey={'question'}>
                {(rowData: FullPoll) => (
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
              <Table.Cell dataKey={'question'}>
                {(rowData: FullPoll) => pollOpensAtView(rowData)}
              </Table.Cell>
            </Table.Column>
            {/* opens at */}
            <Table.Column width={250} resizable>
              <Table.HeaderCell>{t('pollList.closedAt')}</Table.HeaderCell>
              <Table.Cell dataKey={'closedAt'}>
                {(rowData: FullPoll) => pollClosedAtView(rowData)}
              </Table.Cell>
            </Table.Column>
            {/* answers */}
            <Table.Column width={150} resizable>
              <Table.HeaderCell>{t('pollList.answersCount')}</Table.HeaderCell>
              <Table.Cell dataKey={'answers'} align={'center'}>
                {(rowData: FullPoll) => rowData.answers?.length || 0}
              </Table.Cell>
            </Table.Column>
            {/* delete */}
            <Table.Column resizable>
              <Table.HeaderCell align={'center'}>{t('pollList.delete')}</Table.HeaderCell>
              <Table.Cell dataKey={'delete'} align={'center'} style={{padding: '5px 0'}}>
                {(poll: FullPoll) => (
                  <IconButton
                    icon={<TrashIcon />}
                    circle
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

      <DeletePollModal poll={pollDelete} afterDelete={refetch} setPol={setPollDelete} />
    </>
  )
}
