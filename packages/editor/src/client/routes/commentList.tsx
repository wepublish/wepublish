import React, {useEffect, useState} from 'react'

import {
  CommentListQuery,
  FullCommentFragment,
  useCommentListQuery,
  useApproveCommentMutation,
  useRequestChangesOnCommentMutation,
  CommentState,
  CommentRejectionReason,
  Comment,
  useRejectCommentMutation,
  CommentSort,
  CommentListDocument,
  ApproveCommentMutation,
  RequestChangesOnCommentMutation,
  RejectCommentMutation
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {
  Timeline,
  FlexboxGrid,
  Input,
  InputGroup,
  IconButton,
  Table,
  Modal,
  Button,
  Dropdown,
  toaster,
  Message,
  Panel,
  Pagination
} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

import {useTranslation} from 'react-i18next'

import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  mapTableSortTypeToGraphQLSortOrder
} from '../utility'
import {ApolloCache} from '@apollo/client'
import CloseIcon from '@rsuite/icons/legacy/Close'
import SearchIcon from '@rsuite/icons/legacy/Search'
import EditIcon from '@rsuite/icons/legacy/Edit'
import CheckIcon from '@rsuite/icons/legacy/Check'
import ReplyIcon from '@rsuite/icons/legacy/Reply'

const {Column, HeaderCell, Cell} = Table

enum ConfirmAction {
  Approve = 'approve',
  RequestChanges = 'requestChanges',
  Reject = 'reject'
}

function mapCommentActionToColor(currentAction: ConfirmAction) {
  switch (currentAction) {
    case ConfirmAction.Approve:
      return 'green'
    case ConfirmAction.RequestChanges:
      return 'yellow'
    case ConfirmAction.Reject:
      return 'red'
  }
}

function mapCommentActionToTitle(currentAction: ConfirmAction) {
  switch (currentAction) {
    case ConfirmAction.Approve:
      return 'comments.panels.approve'
    case ConfirmAction.RequestChanges:
      return 'comments.panels.requestChanges'
    case ConfirmAction.Reject:
      return 'comments.panels.reject'
  }
}

function mapModalTitle(confirmAction: ConfirmAction): string {
  switch (confirmAction) {
    case ConfirmAction.Approve:
      return 'comments.panels.approveComment'
    case ConfirmAction.Reject:
      return 'comments.panels.rejectComment'
    case ConfirmAction.RequestChanges:
      return 'comments.panels.requestChangesOnComment'
  }
}

function mapColumFieldToGraphQLField(columnField: string): CommentSort | null {
  switch (columnField) {
    case 'createdAt':
      return CommentSort.CreatedAt
    case 'modifiedAt':
      return CommentSort.ModifiedAt
    default:
      return null
  }
}

export function CommentList() {
  const {t} = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortField, setSortField] = useState('modifiedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [filter, setFilter] = useState('')

  const [comments, setComments] = useState<FullCommentFragment[]>([])

  const [approveComment, {loading: isApproving, error: errorApprove}] = useApproveCommentMutation()
  const [
    requestChanges,
    {loading: isRequestingChanges, error: errorRequestingChanges}
  ] = useRequestChangesOnCommentMutation()
  const [rejectComment, {loading: isRejecting, error: errorRejecting}] = useRejectCommentMutation()

  useEffect(() => {
    const error =
      errorApprove?.message ?? errorRequestingChanges?.message ?? errorRejecting?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [errorApprove, errorRequestingChanges, errorRejecting])

  const commentListVariables = {
    first: limit,
    skip: page - 1,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
  }

  const {data, refetch, loading: isLoading} = useCommentListQuery({
    variables: commentListVariables,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
  }, [filter, page, limit, sortOrder, sortField])

  useEffect(() => {
    if (data?.comments?.nodes) {
      setComments(data.comments.nodes)
      if (data.comments.totalCount + 9 < page * limit) {
        setPage(1)
      }
    }
  }, [data?.comments])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentComment, setCurrentComment] = useState<Comment>()

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()
  const [rejectionReason, setRejectionReason] = useState<CommentRejectionReason>()

  const resetCurrentCommentState = () => {
    setRejectionReason(undefined)
    setCurrentComment(undefined)
    setConfirmAction(undefined)
  }

  const refetchListAfterAction = (
    cache: ApolloCache<
      ApproveCommentMutation | RequestChangesOnCommentMutation | RejectCommentMutation
    >
  ) => {
    const query = cache.readQuery<CommentListQuery>({
      query: CommentListDocument,
      variables: commentListVariables
    })

    if (!query) return

    cache.writeQuery<CommentListQuery>({
      query: CommentListDocument,
      data: {
        comments: {
          ...query.comments,
          nodes: query.comments.nodes.filter(comment => comment.id !== currentComment?.id)
        }
      },
      variables: commentListVariables
    })
  }

  const printUsername = currentComment?.user
    ? `${currentComment?.user.name}`
    : ` ${currentComment?.guestUsername} ${t('comments.panels.unregisteredUser')}`

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('comments.overview.comments')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div
        style={{
          display: 'flex',
          flexFlow: 'column',
          marginTop: '20px'
        }}>
        <Table
          autoHeight
          rowClassName={rowData => {
            switch (rowData?.state) {
              case CommentState.Approved:
                return 'approved'
              case CommentState.PendingApproval:
                return 'pending-approval'
              case CommentState.PendingUserChanges:
                return 'pending-user'
              case CommentState.Rejected:
                return 'rejected'
              default:
                return ''
            }
          }}
          style={{marginTop: '20px'}}
          loading={isLoading}
          data={comments}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc')
            setSortField(sortColumn)
          }}>
          <Column width={350} align="left" resizable>
            <HeaderCell>{t('comments.overview.text')}</HeaderCell>
            <Cell dataKey="revisions">
              {(rowData: FullCommentFragment) => (
                <>
                  {rowData?.revisions?.length ? (
                    <RichTextBlock
                      displayOnly
                      displayOneLine
                      disabled
                      // TODO: remove this
                      onChange={console.log}
                      value={rowData?.revisions[rowData?.revisions?.length - 1].text}
                    />
                  ) : null}
                </>
              )}
            </Cell>
          </Column>
          <Column width={150} align="left" resizable>
            <HeaderCell>{t('comments.overview.userName')}</HeaderCell>
            <Cell>
              {(rowData: FullCommentFragment) => (
                <>{rowData.user ? rowData.user?.name : rowData.guestUsername}</>
              )}
            </Cell>
          </Column>
          <Column width={150} align="left" resizable>
            <HeaderCell>{t('comments.overview.state')}</HeaderCell>
            <Cell dataKey="state">
              {(rowData: FullCommentFragment) => {
                let state: string
                switch (rowData?.state) {
                  case CommentState.Approved:
                    state = 'comments.state.approved'
                    break
                  case CommentState.PendingApproval:
                    state = 'comments.state.pendingApproval'
                    break
                  case CommentState.PendingUserChanges:
                    state = 'comments.state.pendingUserChanges'
                    break
                  case CommentState.Rejected:
                    state = 'comments.state.rejected'
                    break
                }
                return <div>{t(state)}</div>
              }}
            </Cell>
          </Column>
          <Column width={150} align="left" resizable sortable>
            <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({modifiedAt}: Comment) =>
                t('comments.overview.modifiedAtDate', {modifiedAtDate: new Date(modifiedAt)})
              }
            </Cell>
          </Column>
          <Column width={150} align="center" fixed="right">
            <HeaderCell>{t('comments.overview.action')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: Comment) => (
                <>
                  <IconButtonTooltip caption={t('comments.overview.approve')}>
                    <IconButton
                      icon={<CheckIcon />}
                      color="green"
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentComment(rowData)
                        setConfirmAction(ConfirmAction.Approve)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('comments.overview.requestChange')}>
                    <IconButton
                      icon={<EditIcon />}
                      color="yellow"
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentComment(rowData)
                        setConfirmAction(ConfirmAction.RequestChanges)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('comments.overview.reject')}>
                    <IconButton
                      icon={<CloseIcon />}
                      color="red"
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={() => {
                        setCurrentComment(rowData)
                        setConfirmAction(ConfirmAction.Reject)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                </>
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
          total={data?.comments.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>
      {confirmAction && (
        <Modal
          open={isConfirmationDialogOpen}
          size="sm"
          overflow
          onClose={() => {
            setConfirmationDialogOpen(false)
            resetCurrentCommentState()
          }}>
          <Modal.Header>
            <Modal.Title>
              <div>{t(mapModalTitle(confirmAction))}</div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <DescriptionList>
              <DescriptionListItem label={t('comments.panels.id')}>
                {currentComment?.id}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.userName')}>
                {printUsername || t('comments.panels.untitled')}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.createdAt')}>
                {currentComment?.createdAt &&
                  t('comments.panels.createdAtDate', {
                    createdAtDate: new Date(currentComment?.createdAt)
                  })}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.updatedAt')}>
                {currentComment?.modifiedAt &&
                  t('comments.panels.modifiedAt', {
                    modifiedAt: new Date(currentComment.modifiedAt)
                  })}
              </DescriptionListItem>

              {currentComment?.parentComment && (
                <>
                  <DescriptionListItem label={t('comments.panels.parent')}>
                    <Panel
                      bordered
                      style={{marginRight: 40, fontStyle: 'italic', color: 'lightslategrey'}}>
                      <>
                        <div>
                          {t('comments.panels.parentDate', {
                            parentDate: new Date(currentComment.parentComment.createdAt)
                          })}
                        </div>
                        <p>{printUsername}:</p>
                        <RichTextBlock
                          displayOnly
                          displayOneLine
                          disabled
                          // TODO: remove this
                          onChange={console.log}
                          value={
                            currentComment.parentComment?.revisions[
                              currentComment.parentComment.revisions.length - 1
                            ]?.text
                          }
                        />
                      </>
                    </Panel>
                    <div style={{marginTop: 8, marginLeft: 10}}>
                      <ReplyIcon rotate={180} />
                    </div>
                  </DescriptionListItem>
                </>
              )}

              <DescriptionListItem label={t('comments.panels.revisions')}>
                <Panel bordered shaded>
                  <Timeline align="left">
                    {currentComment?.revisions?.length
                      ? currentComment?.revisions?.map(({text, createdAt}, i) => (
                          <Timeline.Item key={i}>
                            <div>
                              {t('comments.panels.revisionCreatedAtDate', {
                                revisionCreatedAtDate: new Date(createdAt)
                              })}
                            </div>
                            <RichTextBlock
                              disabled
                              displayOnly
                              // TODO: remove this
                              onChange={console.log}
                              value={text}
                            />
                          </Timeline.Item>
                        ))
                      : null}
                  </Timeline>
                </Panel>
              </DescriptionListItem>
              {confirmAction === ConfirmAction.Reject ||
              confirmAction === ConfirmAction.RequestChanges ? (
                <DescriptionListItem
                  label={t(
                    confirmAction === ConfirmAction.Reject
                      ? 'comments.panels.rejectionReason'
                      : 'comments.panels.requestChangesReason'
                  )}>
                  <Dropdown
                    title={t(
                      rejectionReason ||
                        (confirmAction === ConfirmAction.Reject
                          ? 'comments.panels.rejectionReason'
                          : 'comments.panels.requestChangesReason')
                    )}
                    placement="topEnd">
                    <Dropdown.Item
                      key={CommentRejectionReason.Spam}
                      active={CommentRejectionReason.Spam === rejectionReason}
                      onSelect={() => setRejectionReason(CommentRejectionReason.Spam)}>
                      {CommentRejectionReason.Spam}
                    </Dropdown.Item>
                    <Dropdown.Item
                      key={CommentRejectionReason.Misconduct}
                      active={CommentRejectionReason.Misconduct === rejectionReason}
                      onSelect={() => {
                        setRejectionReason(CommentRejectionReason.Misconduct)
                      }}>
                      {CommentRejectionReason.Misconduct}
                    </Dropdown.Item>
                  </Dropdown>
                  {!rejectionReason && (
                    <div style={{color: 'red'}}>{t('comments.panels.chooseRejectionReason')}</div>
                  )}
                </DescriptionListItem>
              ) : null}
            </DescriptionList>
          </Modal.Body>
          <Modal.Footer>
            <Button
              color={mapCommentActionToColor(confirmAction)}
              disabled={
                isApproving ||
                isRequestingChanges ||
                isRejecting ||
                (!rejectionReason && confirmAction !== ConfirmAction.Approve)
              }
              onClick={async () => {
                if (!currentComment) return
                switch (confirmAction) {
                  case ConfirmAction.Approve:
                    await approveComment({
                      variables: {
                        id: currentComment.id
                      },
                      update: refetchListAfterAction
                    })
                    setConfirmationDialogOpen(false)
                    resetCurrentCommentState()
                    break
                  case ConfirmAction.RequestChanges:
                    if (!rejectionReason) return
                    await requestChanges({
                      variables: {
                        id: currentComment.id,
                        rejectionReason
                      },
                      update: refetchListAfterAction
                    })
                    setConfirmationDialogOpen(false)
                    resetCurrentCommentState()
                    break
                  case ConfirmAction.Reject:
                    if (!rejectionReason) return
                    await rejectComment({
                      variables: {
                        id: currentComment.id,
                        rejectionReason
                      },
                      update: refetchListAfterAction
                    })
                    setConfirmationDialogOpen(false)
                    resetCurrentCommentState()
                    break
                }
              }}>
              {t(mapCommentActionToTitle(confirmAction))}
            </Button>
            <Button
              onClick={() => {
                setConfirmationDialogOpen(false)
                resetCurrentCommentState()
              }}
              appearance="subtle">
              {t('comments.panels.cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  )
}
