import {ApolloError} from '@apollo/client'
import React, {memo, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Col, Form, Grid, Message, Panel, Row, Schema, toaster} from 'rsuite'

import {TagType, useCommentQuery, useUpdateCommentMutation} from '../../api'
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
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null)
  const [editedComment, setEditedComment] = useState<RichTextBlockValue>(null!)

  const {data: commentData, loading: loadingComment} = useCommentQuery({
    variables: {
      id: commentId
    },
    onError: showErrors
  })

  const lastRevision = useMemo(
    () => commentData?.comment?.revisions[commentData?.comment?.revisions.length - 1],
    [commentData]
  )

  const commentTags = useMemo(
    () => selectedTags ?? commentData?.comment?.tags?.map(tag => tag.id),
    [commentData, selectedTags]
  )

  const commentText = useMemo(() => editedComment ?? lastRevision?.text ?? defaultValue, [
    lastRevision,
    editedComment
  ])

  const [updateCommentMutation, {loading: updatingComment}] = useUpdateCommentMutation({
    variables: {
      id: commentId,
      text: commentText,
      tagIds: commentTags
    },
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
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    commentText: StringType().isRequired(t('commentEditView.commentTextRequired'))
  })

  /**
   * FUNCTIONS
   */
  async function updateComment() {
    await updateCommentMutation()
    if (close) {
      navigate(closePath)
    }
  }

  return (
    <>
      <Form
        onSubmit={() => updateComment()}
        model={validationModel}
        fluid
        disabled={loading}
        formValue={{
          commentText
        }}>
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
            {/* comment text */}
            <Col xs={14}>
              {commentText && (
                <Panel bordered style={{width: '100%'}}>
                  <RichTextBlock value={commentText} onChange={setEditedComment} />
                </Panel>
              )}
            </Col>

            {/* tags */}
            <Col xs={10}>
              <Form.ControlLabel>{t('comments.edit.tags')}</Form.ControlLabel>
              <SelectTags
                selectedTags={commentTags}
                setSelectedTags={setSelectedTags}
                tagType={TagType.Comment}
              />
            </Col>
          </Row>
        </Grid>
      </Form>
    </>
  )
})
