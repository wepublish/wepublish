import React, {useEffect, useState} from 'react'

// import {Link, ButtonLink} from '../route'

import {
  CommentRefFragment,
  useCommentListQuery,
  useApproveCommentMutation,
  useRequestChangesOnCommentMutation,
  // CommentListDocument,
  // CommentListQuery,
  // PageRefFragment,
  CommentState,
  CommentRejectionReason,
  Comment,
  useRejectCommentMutation,
  CommentSort
} from '../api'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Input,
  InputGroup,
  Icon,
  IconButton,
  Table,
  Modal,
  Button,
  Dropdown
} from 'rsuite'
import {DEFAULT_TABLE_PAGE_SIZES, mapTableSortTypeToGraphQLSortOrder} from '../utility'

const {Column, HeaderCell, Cell, Pagination} = Table

enum ConfirmAction {
  Approve = 'approve',
  RequestChanges = 'requestChanges',
  Reject = 'reject'
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

  const [filter, setFilter] = useState('')

  const [comments, setComments] = useState<CommentRefFragment[]>([])

  const [approveComment, {loading: isApproving}] = useApproveCommentMutation()
  const [requestChanges, {loading: isRequestingChanges}] = useRequestChangesOnCommentMutation()
  const [rejectComment, {loading: isRejecting}] = useRejectCommentMutation()

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
        <Column width={400} align="left" resizable>
          <HeaderCell>{t('comments.overview.text')}</HeaderCell>
          <Cell dataKey="createdAt">
            {(rowData: CommentRefFragment) => (
              <>
                {rowData?.revisions?.length
                  ? rowData?.revisions?.map(({text}, i) => (
                      <RichTextBlock
                        key={i}
                        disabled
                        // TODO: remove this
                        onChange={console.log}
                        value={text}
                      />
                    ))
                  : null}
              </>
            )}
          </Cell>
        </Column>
        <Column width={150} align="left" resizable>
          <HeaderCell>{t('comments.overview.userName')}</HeaderCell>
          <Cell>{(rowData: CommentRefFragment) => <>{rowData.user?.name}</>}</Cell>
        </Column>
        <Column width={150} align="left" resizable>
          <HeaderCell>{t('comments.overview.states')}</HeaderCell>
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
                default:
                  state = rowData?.state
                  break
              }
              return <div>{t(state)}</div>
            }}
          </Cell>
        </Column>
        <Column width={100} align="left" resizable sortable>
          <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
          <Cell dataKey="modifiedAt" />
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('comments.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: Comment) => (
              <>
                <IconButton
                  icon={<Icon icon="check" />}
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
                  icon={<Icon icon="trash" />}
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
      <Modal
        show={isConfirmationDialogOpen}
        width="sm"
        overflow
        onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            {confirmAction === ConfirmAction.Approve
              ? t('comments.panels.approveComment')
              : t('articles.panels.deleteArticle')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('comments.panels.userName')}>
              {currentComment?.user.name || t('comments.panels.untitled')}
            </DescriptionListItem>
            {currentComment?.revisions?.length
              ? currentComment?.revisions?.map(({text}, i) => (
                  <DescriptionListItem key={i} label={t('comments.panels.revisions')}>
                    <RichTextBlock
                      disabled
                      // TODO: remove this
                      onChange={console.log}
                      value={text}
                    />
                  </DescriptionListItem>
                ))
              : null}
            {confirmAction === ConfirmAction.Reject ||
            confirmAction === ConfirmAction.RequestChanges ? (
              <DescriptionListItem label={t('comments.panels.rejectionReason')}>
                <Dropdown title={t('comments.panels.rejectionReason')}>
                  <Dropdown.Item>{CommentRejectionReason.Spam}</Dropdown.Item>
                  <Dropdown.Item>{CommentRejectionReason.Misconduct}</Dropdown.Item>
                </Dropdown>
              </DescriptionListItem>
            ) : null}
          </DescriptionList>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color={confirmAction === ConfirmAction.Approve ? 'green' : 'red'}
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
                  break
                case ConfirmAction.RequestChanges:
                  await requestChanges({
                    variables: {
                      id: currentComment.id,
                      rejectionReason: CommentRejectionReason.Misconduct
                    }
                  })
                  break
                case ConfirmAction.Reject:
                  await rejectComment({
                    variables: {
                      id: currentComment.id,
                      rejectionReason: CommentRejectionReason.Misconduct
                    }
                  })
                  break
              }
              setConfirmationDialogOpen(false)
            }}>
            {t('articles.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('articles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
