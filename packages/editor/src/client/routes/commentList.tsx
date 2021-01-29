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
  Comment
} from '../api'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Input, InputGroup, Icon, IconButton, Table, Modal, Button} from 'rsuite'
const {Column, HeaderCell, Cell} = Table

enum ConfirmAction {
  Approve = 'approve',
  RequestChanges = 'requestChanges',
  Reject = 'reject'
}

const CommentsPerPage = 50

export function CommentList() {
  const [filter, setFilter] = useState('')

  const [comments, setComments] = useState<CommentRefFragment[]>([])

  const [rejectComment, {loading: isApproving}] = useApproveCommentMutation()
  const [requestChanges, {loading: isRequestingChanges}] = useRequestChangesOnCommentMutation()

  const listVariables = {filter: filter || undefined, first: CommentsPerPage}
  const {data, fetchMore, loading: isLoading} = useCommentListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const {t} = useTranslation()

  console.log('Data:', data, rejectComment, isRequestingChanges)

  useEffect(() => {
    if (data?.comments.nodes) {
      setComments(data.comments.nodes)
    }
  }, [data?.comments])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentComment, setCurrentComment] = useState<Comment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  console.log('currentComment:', currentComment)
  console.log('confirmAction: ', confirmAction)

  function loadMore() {
    fetchMore({
      variables: {...listVariables, after: data?.comments.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          comments: {
            ...fetchMoreResult.comments,
            nodes: [...prev.comments.nodes, ...fetchMoreResult?.comments.nodes]
          }
        }
      }
    })
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

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={comments}>
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.userName')}</HeaderCell>
          <Cell>{(rowData: CommentRefFragment) => <>{rowData.user?.name}</>}</Cell>
        </Column>
        <Column width={400} align="left" resizable>
          <HeaderCell>{t('comments.overview.created')}</HeaderCell>
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
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
          <Cell dataKey="modifiedAt" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.states')}</HeaderCell>
          <Cell>
            {(rowData: CommentRefFragment) => {
              let state: string
              switch (rowData?.state) {
                case CommentState.Approved:
                  state = 'comments.state.pendingApproval'
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
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('comments.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: Comment) => (
              <>
                {/* {JSON.stringify(rowData)} */}
                {/* {rowData.published && (
                  <IconButton
                    icon={<Icon icon="arrow-circle-o-down" />}
                    circle
                    size="sm"
                    onClick={() => {
                      setCurrentComment(rowData)
                      setConfirmAction(ConfirmAction.Unpublish)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                )} */}
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

      {/* {data?.comments.pageInfo.hasNextPage && (
        <Button label={t('comments.overview.loadMore')} onClick={loadMore} />
      )} */}
      {data?.comments.pageInfo.hasNextPage && (
        <Button label={t('articles.overview.loadMore')} onClick={loadMore} />
      )}

      <Modal
        show={isConfirmationDialogOpen}
        width={'sm'}
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
            <DescriptionListItem label={t('comments.panels.title')}>
              {currentComment?.id || t('comments.panels.untitled')}
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
          </DescriptionList>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color={'red'}
            disabled={isApproving}
            onClick={async () => {
              if (!currentComment) return

              switch (confirmAction) {
                case ConfirmAction.RequestChanges:
                  await requestChanges({
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
