import {ApolloError} from '@apollo/client'
import SpinnerIcon from '@rsuite/icons/legacy/Spinner'
import React, {memo, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {
  Button,
  Col,
  Divider,
  FlexboxGrid,
  Form,
  Grid,
  Loader,
  Message,
  Pagination,
  Panel,
  Row,
  TagPicker,
  toaster
} from 'rsuite'

import {
  SortOrder,
  TagSort,
  TagType,
  useCommentQuery,
  useTagListQuery,
  useUpdateCommentMutation
} from '../api'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import {DEFAULT_MAX_TABLE_PAGES} from '../utility'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export const CommentEditView = memo(() => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const {id} = useParams()
  const commentId = id!

  const [page, setPage] = useState(1)

  const [selectedTags, setSelectedTags] = useState<string[] | null>(null)
  const [editedComment, setEditedComment] = useState<RichTextBlockValue>(null!)

  const [updateComment, {loading: isUpdating}] = useUpdateCommentMutation({
    onCompleted: () =>
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('comments.edit.success')}
        </Message>
      ),
    onError: showErrors
  })
  const {data: commentData, loading} = useCommentQuery({
    variables: {
      id: commentId
    },
    onError: showErrors
  })

  const {data: tagsData} = useTagListQuery({
    variables: {
      filter: {
        type: TagType.Comment
      },
      sort: TagSort.Tag,
      order: SortOrder.Ascending
    },
    onError: showErrors
  })

  const availableTags = useMemo(() => {
    if (!tagsData?.tags?.nodes) {
      return []
    }

    return tagsData.tags.nodes.map(tag => ({
      label: tag.tag || t('comments.edit.unnamedTag'),
      value: tag.id
    }))
  }, [tagsData])

  const lastRevision = useMemo(
    () => commentData?.comment?.revisions[commentData?.comment?.revisions.length - 1],
    [commentData]
  )

  const commentTags = useMemo(
    () => selectedTags ?? commentData?.comment?.tags?.map(tag => tag.id),
    [commentData, selectedTags]
  )

  const commentText = useMemo(() => editedComment ?? lastRevision?.text, [
    lastRevision,
    editedComment
  ])

  return (
    <>
      <FlexboxGrid style={{marginBottom: '40px'}}>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('comments.edit.title')}</h2>
        </FlexboxGrid.Item>

        {commentText && (
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Button
              type="button"
              appearance="ghost"
              data-testid="save"
              disabled={isUpdating}
              onClick={() =>
                updateComment({
                  variables: {
                    id: commentId,
                    text: commentText,
                    tagIds: commentTags
                  }
                })
              }>
              {isUpdating ? (
                <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <SpinnerIcon spin /> {t('comments.edit.loading')}
                </p>
              ) : (
                t('save')
              )}
            </Button>

            <Button
              style={{marginLeft: '12px'}}
              type="button"
              appearance="primary"
              data-testid="save-and-close"
              disabled={isUpdating}
              onClick={() =>
                updateComment({
                  variables: {
                    id: commentId,
                    text: commentText,
                    tagIds: commentTags
                  },
                  onCompleted() {
                    navigate('/comments')
                  }
                })
              }>
              {isUpdating ? (
                <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <SpinnerIcon spin /> {t('comments.edit.loading')}
                </p>
              ) : (
                t('saveAndClose')
              )}
            </Button>
          </FlexboxGrid.Item>
        )}
      </FlexboxGrid>

      {loading && (
        <FlexboxGrid justify="center">
          <Loader size="lg" style={{margin: '30px'}} />
        </FlexboxGrid>
      )}

      <Grid fluid style={{margin: '0'}}>
        <Row gutter={12}>
          <Col xs={14}>
            {commentText && (
              <Panel bordered style={{width: '100%'}}>
                <RichTextBlock value={commentText} onChange={setEditedComment} />
              </Panel>
            )}
          </Col>

          <Col xs={10}>
            <Form.ControlLabel>{t('comments.edit.tags')}</Form.ControlLabel>

            {commentTags && (
              <TagPicker
                block
                virtualized
                value={commentTags}
                data={availableTags}
                onChange={(value: string[]) => setSelectedTags(value)}
                renderMenu={menu => {
                  return (
                    <>
                      {menu}

                      <Divider style={{margin: '12px 0'}} />

                      <Pagination
                        style={{
                          padding: '0 12px 12px'
                        }}
                        limit={50}
                        maxButtons={DEFAULT_MAX_TABLE_PAGES}
                        first
                        last
                        prev
                        next
                        ellipsis
                        boundaryLinks
                        layout={['total', '-', '|', 'pager']}
                        total={tagsData?.tags?.totalCount ?? 0}
                        activePage={page}
                        onChangePage={page => setPage(page)}
                      />
                    </>
                  )
                }}
              />
            )}
          </Col>
        </Row>
      </Grid>
    </>
  )
})
