import {ApolloError} from '@apollo/client'
import React, {memo, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Col, Form, Grid, Message, Panel, Row, Schema, toaster} from 'rsuite'

import {
  CommentRevisionUpdateInput,
  FullCommentFragment,
  TagType,
  useCommentQuery,
  useUpdateCommentMutation
} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'
import {SelectTags} from '../../atoms/tag/selectTags'
import {BlockMap} from '../../blocks/blockMap'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {BlockType, RichTextBlockValue} from '../../blocks/types'
import {isValueConstructor} from '../../utility'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

const richTextBlock = BlockMap[BlockType.RichText]
const defaultValue = isValueConstructor(richTextBlock.defaultValue)
  ? richTextBlock.defaultValue()
  : richTextBlock.defaultValue

export const CommentEditView = memo(() => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const {id} = useParams()
  const commentId = id!
  const closePath = '/comments'
  const [close, setClose] = useState<boolean>(false)
  // where the tag list is handled
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null)
  // where the comment properties are handled
  const [comment, setComment] = useState<FullCommentFragment | undefined | null>(undefined)
  // where the revisions are handled
  const [revision, setRevision] = useState<CommentRevisionUpdateInput | undefined>(undefined)

  const {data: commentData, loading: loadingComment} = useCommentQuery({
    variables: {
      id: commentId
    },
    onError: showErrors
  })

  useEffect(() => {
    const tmpComment = commentData?.comment
    if (!tmpComment) {
      return
    }
    setComment(tmpComment)
    const revisions = tmpComment.revisions
    setRevision(revisions[revisions.length - 1])
  }, [commentData])

  const commentTags = useMemo(() => selectedTags ?? comment?.tags?.map(tag => tag.id), [
    comment,
    selectedTags
  ])

  const [updateCommentMutation, {loading: updatingComment}] = useUpdateCommentMutation({
    onCompleted: () =>
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('comments.edit.success')}
        </Message>
      ),
    onError: showErrors
  })

  const loading = updatingComment || loadingComment

  /**
   * Form validation model
   */
  const validationModel = Schema.Model({})

  /**
   * FUNCTIONS
   */
  async function updateComment() {
    if (!comment) {
      return
    }
    await updateCommentMutation({
      variables: {
        id: comment.id,
        revision: {text: revision?.text || defaultValue},
        tagIds: commentTags
      }
    })
    if (close) {
      navigate(closePath)
    }
  }

  return (
    <>
      <Form onSubmit={() => updateComment()} model={validationModel} fluid disabled={loading}>
        {/* heading */}
        <ModelTitle
          loading={loading}
          title={t('comments.edit.title')}
          loadingTitle={t('comments.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setClose}
        />

        {/* form elements */}
        <Grid fluid style={{margin: '0'}}>
          <Row gutter={12}>
            <Col xs={12}>
              <Panel
                bordered
                style={{width: '100%'}}
                header={t('commentEditView.commentPanelHeader')}>
                <Row>
                  {/* comment title */}
                  <Col xs={24}>
                    <Form.Control
                      name="commentTitle"
                      value={revision?.title}
                      placeholder={t('commentEditView.title')}
                    />
                  </Col>
                  {/* comment text */}
                  <Col xs={24}>
                    <RichTextBlock
                      value={revision?.text || defaultValue}
                      onChange={text => {
                        setRevision({...revision, text: text as RichTextBlockValue})
                      }}
                    />
                  </Col>
                </Row>
              </Panel>
            </Col>

            <Col xs={6}>
              <Row>
                {/* tags */}
                <Col xs={24}>
                  <Form.ControlLabel>{t('comments.edit.tags')}</Form.ControlLabel>
                  <SelectTags
                    selectedTags={commentTags}
                    setSelectedTags={setSelectedTags}
                    tagType={TagType.Comment}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Grid>
      </Form>
    </>
  )
})
