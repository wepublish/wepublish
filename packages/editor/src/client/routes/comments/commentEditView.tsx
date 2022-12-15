import {ApolloError} from '@apollo/client'
import {Visible} from '@rsuite/icons'
import React, {memo, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {
  Col,
  FlexboxGrid,
  Form,
  Grid,
  IconButton,
  Message,
  Panel,
  Row,
  Schema,
  SelectPicker,
  toaster
} from 'rsuite'

import {
  CommentRevisionUpdateInput,
  FullCommentFragment,
  TagType,
  useCommentQuery,
  useRatingSystemQuery,
  useUpdateCommentMutation
} from '../../api'
import {stripTypename} from '../../api/strip-typename'
import {CommentDeleteBtn} from '../../atoms/comment/commentDeleteBtn'
import {CommentHistory} from '../../atoms/comment/commentHistory'
import {CommentStateDropdown} from '../../atoms/comment/commentStateDropdown'
import {CommentUser} from '../../atoms/comment/commentUser'
import {ModelTitle} from '../../atoms/modelTitle'
import {createCheckedPermissionComponent} from '../../atoms/permissionControl'
import {SelectTags} from '../../atoms/tag/selectTags'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../../blocks/types'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

/**
 * Helper function to parse comment revision input object out of full revision fragment.
 * @param comment
 */
function getLastRevision(comment: FullCommentFragment): CommentRevisionUpdateInput | undefined {
  const revisions = comment.revisions
  if (!revisions.length) {
    return
  }

  const lastRevision = revisions[revisions.length - 1]
  const parsedRevision = {
    title: lastRevision?.title,
    lead: lastRevision?.lead,
    text: lastRevision?.text
  } as CommentRevisionUpdateInput

  return parsedRevision
}

/**
 * Check, if revision object differs from original. Used to decide, whether to create a new revision.
 */
function hasRevisionChanged(
  comment: FullCommentFragment | undefined,
  revision: CommentRevisionUpdateInput | undefined
): boolean {
  if (!comment) {
    return true
  }

  const originalVersion = getLastRevision(comment)

  return JSON.stringify(originalVersion) !== JSON.stringify(revision)
}

const CommentEditView = memo(() => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const {id} = useParams()
  const commentId = id!
  const closePath = '/comments'
  const validationModel = Schema.Model({})
  const [close, setClose] = useState<boolean>(false)
  // where the comment properties are handled
  const [comment, setComment] = useState<FullCommentFragment | undefined>(undefined)
  // where the revisions are handled
  const [revision, setRevision] = useState<CommentRevisionUpdateInput | undefined>(undefined)
  // where the tag list is handled
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null)

  /**
   * Queries
   */
  const {data: commentData, loading: loadingComment} = useCommentQuery({
    variables: {
      id: commentId
    },
    onError: showErrors
  })

  const {data: ratingSystem, loading: loadingRatingSystem} = useRatingSystemQuery({
    onError: showErrors
  })

  const [updateCommentMutation, {loading: updatingComment}] = useUpdateCommentMutation({
    onCompleted: () =>
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('comments.edit.success')}
        </Message>
      ),
    onError: showErrors
  })

  // compute loading state
  const loading = updatingComment || loadingComment || loadingRatingSystem

  /**
   * Initial set of variables "comment" and "revision"
   */
  useEffect(() => {
    const tmpComment = commentData?.comment
    if (!tmpComment) {
      return
    }
    setComment(tmpComment)

    const lastRevision = getLastRevision(tmpComment)
    setRevision(lastRevision)
  }, [commentData])

  const commentTags = useMemo(() => selectedTags ?? comment?.tags?.map(tag => tag.id), [
    comment,
    selectedTags
  ])

  const ratingOverrides = useMemo(
    () =>
      ratingSystem?.ratingSystem.answers.map(answer => ({
        answerId: answer.id,
        name: answer.answer,
        value:
          comment?.overriddenRatings?.find(override => override.answerId === answer.id)?.value ??
          null
      })) ?? [],
    [comment, ratingSystem]
  )

  const ratingOverridePossibleValues = [
    {label: t('commentEditView.noOverride'), value: null},
    {label: '1', value: 1},
    {label: '2', value: 2},
    {label: '3', value: 3},
    {label: '4', value: 4},
    {label: '5', value: 5}
  ]

  async function updateComment() {
    if (!comment) {
      return
    }

    await updateCommentMutation({
      variables: {
        id: comment.id,
        revision: hasRevisionChanged(comment, revision) ? revision : undefined,
        userID: comment.user?.id || null,
        guestUsername: comment.guestUsername,
        guestUserImageID: comment.guestUserImage?.id || null,
        source: comment.source,
        tagIds: commentTags,
        ratingOverrides: comment.overriddenRatings?.map(stripTypename)
      }
    })

    if (close) {
      navigate(closePath)
    }
  }

  return (
    <Form onSubmit={() => updateComment()} model={validationModel} fluid disabled={loading}>
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
      <Grid fluid>
        <Row gutter={30}>
          {/* comment content */}
          <Col xs={14}>
            <Row>
              <Col xs={24} style={{marginTop: '0px'}}>
                <Panel bordered style={{width: '100%'}}>
                  <Row>
                    {/* comment title */}
                    <Col xs={18}>
                      <Form.ControlLabel>{t('commentEditView.title')}</Form.ControlLabel>
                      <Form.Control
                        name="commentTitle"
                        value={revision?.title || ''}
                        placeholder={t('commentEditView.title')}
                        onChange={(title: string) =>
                          setRevision(oldRevision => ({...oldRevision, title}))
                        }
                      />
                    </Col>
                    {/* comment lead */}
                    <Col xs={18}>
                      <Form.ControlLabel>{t('commentEditView.lead')}</Form.ControlLabel>
                      <Form.Control
                        name="commentLead"
                        value={revision?.lead || ''}
                        placeholder={t('commentEditView.lead')}
                        onChange={(lead: string) =>
                          setRevision(oldRevision => ({...oldRevision, lead}))
                        }
                      />
                    </Col>
                    {/* comment text */}
                    <Col xs={24} style={{marginTop: '20px'}}>
                      <Form.ControlLabel>{t('commentEditView.comment')}</Form.ControlLabel>
                      <Panel bordered>
                        <RichTextBlock
                          value={revision?.text || []}
                          onChange={text =>
                            setRevision(oldRevision => ({
                              ...oldRevision,
                              text: text as RichTextBlockValue
                            }))
                          }
                        />
                      </Panel>
                    </Col>
                  </Row>
                </Panel>
              </Col>
            </Row>

            <Row>
              <Col xs={24}>
                <Panel bordered header={t('commentEditView.commentContextHeader')}>
                  <Row>
                    <Col xs={24}>
                      {comment && (
                        <CommentHistory
                          commentItemID={comment.itemID}
                          commentId={comment.id}
                          commentItemType={comment.itemType}
                        />
                      )}
                    </Col>
                  </Row>
                </Panel>
              </Col>
            </Row>
          </Col>

          <Col xs={10}>
            <Row>
              {/* some actions on the comment */}
              <Col xs={24} style={{marginTop: '0px'}}>
                <Panel bordered header={t('commentEditView.actions')}>
                  <FlexboxGrid>
                    <FlexboxGrid.Item colspan={24} style={{textAlign: 'end'}}>
                      <IconButton
                        appearance="ghost"
                        color="violet"
                        icon={<Visible />}
                        onClick={() => {
                          navigate(`/articles/edit/${comment?.itemID}`)
                        }}>
                        {t('commentEditView.goToArticle')}
                      </IconButton>
                    </FlexboxGrid.Item>

                    <FlexboxGrid.Item colspan={24} style={{marginTop: '10px', textAlign: 'end'}}>
                      {comment && (
                        <CommentStateDropdown
                          comment={comment}
                          onStateChanged={async (state, rejectionReason) => {
                            setComment({
                              ...comment,
                              state,
                              rejectionReason
                            })
                          }}
                        />
                      )}
                    </FlexboxGrid.Item>

                    <FlexboxGrid.Item style={{marginTop: '10px', textAlign: 'end'}} colspan={24}>
                      <CommentDeleteBtn
                        comment={comment}
                        onCommentDeleted={() => {
                          navigate(closePath)
                        }}
                      />
                    </FlexboxGrid.Item>
                  </FlexboxGrid>
                </Panel>
              </Col>

              {/* tags & source */}
              <Col xs={24}>
                <Panel bordered header={t('commentEditView.variousPanelHeader')}>
                  <Row>
                    {/* tags */}
                    <Col xs={24}>
                      <Form.ControlLabel>{t('commentEditView.tags')}</Form.ControlLabel>
                      <SelectTags
                        selectedTags={commentTags}
                        setSelectedTags={setSelectedTags}
                        tagType={TagType.Comment}
                      />
                    </Col>

                    {/* external source */}
                    <Col xs={24}>
                      <Form.ControlLabel>{t('commentEditView.source')}</Form.ControlLabel>
                      <Form.Control
                        name="externalSource"
                        placeholder={t('commentEditView.source')}
                        value={comment?.source || ''}
                        onChange={(source: string) => {
                          setComment(oldComment => ({...oldComment, source} as FullCommentFragment))
                        }}
                      />
                    </Col>
                  </Row>
                </Panel>
              </Col>

              {/* user or guest user */}
              <Col xs={24}>
                <Panel bordered header={t('commentEditView.userPanelHeader')}>
                  <CommentUser comment={comment} setComment={setComment} />
                </Panel>
              </Col>

              {/* rating overrides */}
              <Col xs={24} style={{marginTop: '0px'}}>
                <Panel bordered header={t('commentEditView.ratingOverrides')}>
                  <FlexboxGrid>
                    {ratingOverrides.map(override => (
                      <FlexboxGrid.Item
                        key={override.answerId}
                        colspan={24}
                        style={{marginTop: '10px'}}>
                        <Form.ControlLabel>{override.name}</Form.ControlLabel>
                        <SelectPicker
                          block
                          cleanable={false}
                          data={ratingOverridePossibleValues}
                          value={override.value}
                          onChange={value =>
                            setComment(oldComment =>
                              oldComment
                                ? {
                                    ...oldComment,
                                    overriddenRatings: ratingOverrides.map(oldOverride =>
                                      oldOverride.answerId === override.answerId
                                        ? {answerId: override.answerId, value}
                                        : {answerId: oldOverride.answerId, value: oldOverride.value}
                                    )
                                  }
                                : undefined
                            )
                          }
                        />
                      </FlexboxGrid.Item>
                    ))}
                  </FlexboxGrid>
                </Panel>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>
    </Form>
  )
})

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_UPDATE_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION'
])(CommentEditView)
export {CheckedPermissionComponent as CommentEditView}
