import React, {useEffect, useState} from 'react'

import {
  CommentRefFragment,
  useCommentListQuery,
  useApproveCommentMutation,
  useRequestChangesOnCommentMutation,
  CommentState,
  CommentRejectionReason,
  Comment,
  useRejectCommentMutation,
  CommentSort
} from '../api'
import {
  Timeline,
  FlexboxGrid,
  Input,
  InputGroup,
  Icon,
  IconButton,
  Table,
  Modal,
  Button,
  Dropdown,
  Alert
} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

import {useTranslation} from 'react-i18next'

import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'

const {Column, HeaderCell, Cell, Pagination} = Table

enum ConfirmAction {
  Approve = 'approve',
  RequestChanges = 'requestChanges',
  Reject = 'reject'
}

function mapCommentActionToColor(currentAction?: ConfirmAction) {
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
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [shouldRefetch, setShouldRefetch] = useState(false)

  const [filter, setFilter] = useState('')

  const [comments, setComments] = useState<CommentRefFragment[]>([])

  const [approveComment, {loading: isApproving, error: errorApprove}] = useApproveCommentMutation()
  const [
    requestChanges,
    {loading: isRequestingChanges, error: errorRequestingChanges}
  ] = useRequestChangesOnCommentMutation()
  const [rejectComment, {loading: isRejecting, error: errorRejecting}] = useRejectCommentMutation()

  useEffect(() => {
    const error =
      errorApprove?.message ?? errorRequestingChanges?.message ?? errorRejecting?.message
    if (error) Alert.error(error, 0)
  }, [errorApprove, errorRequestingChanges, errorRejecting])

  const {data, refetch, loading: isLoading} = useCommentListQuery({
    variables: {
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    refetch({
      first: limit,
      skip: page - 1,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder)
    })
    setShouldRefetch(false)
  }, [filter, page, limit, sortOrder, sortField, shouldRefetch])

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
  const [rejectionReasonError, setRejectionReasonError] = useState<string>('')

  const resetCurrentCommentState = () => {
    setRejectionReason(undefined)
    setCurrentComment(undefined)
    setConfirmAction(undefined)
    setRejectionReasonError('')
  }

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
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table
        autoHeight={true}
        style={{marginTop: '20px'}}
        loading={isLoading}
        data={comments}
        sortColumn={sortField}
        sortType={sortOrder}
        onSortColumn={(sortColumn, sortType) => {
          setSortOrder(sortType)
          setSortField(sortColumn)
        }}>
        <Column width={350} align="left" resizable>
          <HeaderCell>{t('comments.overview.text')}</HeaderCell>
          <Cell dataKey="createdAt">
            {(rowData: CommentRefFragment) => (
              <>
                {rowData?.revisions?.length ? (
                  <RichTextBlock
                    displayOnly
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
          <Cell>{(rowData: CommentRefFragment) => <>{rowData.user?.name}</>}</Cell>
        </Column>
        <Column width={150} align="left" resizable>
          <HeaderCell>{t('comments.overview.state')}</HeaderCell>
          <Cell dataKey="state">
            {(rowData: CommentRefFragment) => {
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
            {({modifiedAt}: Comment) => new Date(modifiedAt).toLocaleString()}
          </Cell>
        </Column>
        <Column width={150} align="center" fixed="right">
          <HeaderCell>{t('comments.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: Comment) => (
              <>
                <IconButton
                  icon={<Icon icon="check" />}
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
                <IconButton
                  icon={<Icon icon="edit" />}
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
                <IconButton
                  icon={<Icon icon="close" />}
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
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Pagination
        style={{height: '50px'}}
        lengthMenu={DEFAULT_TABLE_PAGE_SIZES}
        activePage={page}
        displayLength={limit}
        total={data?.comments.totalCount}
        onChangePage={page => setPage(page)}
        onChangeLength={limit => setLimit(limit)}
      />
      {confirmAction && (
        <Modal
          show={isConfirmationDialogOpen}
          width="sm"
          overflow
          onHide={() => {
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
                {currentComment?.user.name || t('comments.panels.untitled')}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.createdAt')}>
                {currentComment?.createdAt && new Date(currentComment.createdAt).toDateString()}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.updatedAt')}>
                {currentComment?.modifiedAt && new Date(currentComment.modifiedAt).toDateString()}
              </DescriptionListItem>
              <DescriptionListItem label={t('comments.panels.revisions')}>
                <Timeline align="left">
                  {currentComment?.revisions?.length
                    ? currentComment?.revisions?.map(({text, createdAt}, i) => (
                        <Timeline.Item key={i}>
                          <div>{new Date(createdAt).toLocaleString()}</div>
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
                      onSelect={() => {
                        setRejectionReason(CommentRejectionReason.Spam)
                        setRejectionReasonError('')
                      }}>
                      {CommentRejectionReason.Spam}
                    </Dropdown.Item>
                    <Dropdown.Item
                      key={CommentRejectionReason.Misconduct}
                      active={CommentRejectionReason.Misconduct === rejectionReason}
                      onSelect={() => {
                        setRejectionReason(CommentRejectionReason.Misconduct)
                        setRejectionReasonError('')
                      }}>
                      {CommentRejectionReason.Misconduct}
                    </Dropdown.Item>
                  </Dropdown>
                  {rejectionReasonError && (
                    <div style={{color: 'red'}}>{t(rejectionReasonError)}</div>
                  )}
                </DescriptionListItem>
              ) : null}
            </DescriptionList>
          </Modal.Body>
          <Modal.Footer>
            <Button
              color={mapCommentActionToColor(confirmAction)}
              disabled={isApproving || isRequestingChanges || isRejecting}
              onClick={async () => {
                if (!currentComment) return
                switch (confirmAction) {
                  case ConfirmAction.Approve:
                    await approveComment({
                      variables: {
                        id: currentComment.id
                      }
                    })
                    setConfirmationDialogOpen(false)
                    setShouldRefetch(true)
                    resetCurrentCommentState()
                    break
                  case ConfirmAction.RequestChanges:
                    if (!rejectionReason) {
                      setRejectionReasonError('comments.panels.chooseRejectionReason')
                    } else {
                      await requestChanges({
                        variables: {
                          id: currentComment.id,
                          rejectionReason
                        }
                      })
                      setConfirmationDialogOpen(false)
                      setShouldRefetch(true)
                      resetCurrentCommentState()
                    }
                    break
                  case ConfirmAction.Reject:
                    if (!rejectionReason) {
                      setRejectionReasonError('comments.panels.chooseRejectionReason')
                    } else {
                      await rejectComment({
                        variables: {
                          id: currentComment.id,
                          rejectionReason
                        }
                      })
                      setConfirmationDialogOpen(false)
                      setShouldRefetch(true)
                      resetCurrentCommentState()
                    }
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
