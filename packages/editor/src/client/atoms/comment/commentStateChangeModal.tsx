import ReplyIcon from '@rsuite/icons/legacy/Reply'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Dropdown, Message, Modal, Panel, Timeline, toaster} from 'rsuite'

import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
  useApproveCommentMutation,
  useRejectCommentMutation,
  useRequestChangesOnCommentMutation
} from '../../api'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {DescriptionList, DescriptionListItem} from '../descriptionList'

function mapModalTitle(commentState: CommentState): string {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.panels.approveComment'
    case CommentState.Rejected:
      return 'comments.panels.rejectComment'
    case CommentState.PendingUserChanges:
    case CommentState.PendingApproval:
      return 'comments.panels.requestChangesOnComment'
  }
}

export function mapCommentActionToBtnTitle(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.panels.approve'
    case CommentState.PendingUserChanges:
    case CommentState.PendingApproval:
      return 'comments.panels.requestChanges'
    case CommentState.Rejected:
      return 'comments.panels.reject'
  }
}

interface CommentStateChangeModalProps {
  comment: FullCommentFragment
  newCommentState: CommentState
  onStateChanged?(): void
  onClose?(): void
}

export function CommentStateChangeModal({
  comment,
  newCommentState,
  onStateChanged,
  onClose
}: CommentStateChangeModalProps) {
  const {t} = useTranslation()
  const [open, setOpen] = useState<boolean>(false)
  const [rejectionReason, setRejectionReason] = useState<CommentRejectionReason>()
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

  // handling the modal visibility
  useEffect(() => {
    if (comment && comment.state !== newCommentState) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [newCommentState])

  useEffect(() => {
    if (!open && onClose) {
      onClose()
    }
  }, [open])

  const printUsername = comment?.user?.name
    ? `${comment.user.name}`
    : `${comment?.guestUsername || t('comments.panels.noUserName')} ${t(
        'comments.panels.unregisteredUser'
      )}`

  return (
    <Modal open={open} size="sm" overflow>
      <Modal.Header>
        <Modal.Title>
          <div>{t(mapModalTitle(newCommentState))}</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DescriptionList>
          <DescriptionListItem label={t('comments.panels.id')}>{comment?.id}</DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.userName')}>
            {printUsername}
          </DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.createdAt')}>
            {comment?.createdAt &&
              t('comments.panels.createdAtDate', {
                createdAtDate: new Date(comment?.createdAt)
              })}
          </DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.updatedAt')}>
            {comment?.modifiedAt &&
              t('comments.panels.modifiedAt', {
                modifiedAt: new Date(comment.modifiedAt)
              })}
          </DescriptionListItem>

          {comment?.parentComment && (
            <>
              <DescriptionListItem label={t('comments.panels.parent')}>
                <Panel
                  bordered
                  style={{marginRight: 40, fontStyle: 'italic', color: 'lightslategrey'}}>
                  <>
                    <div>
                      {t('comments.panels.parentDate', {
                        parentDate: new Date(comment.parentComment.createdAt)
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
                        comment.parentComment.revisions[comment.parentComment.revisions.length - 1]
                          ?.text || []
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
                {comment?.revisions?.length
                  ? comment?.revisions?.map(({text, createdAt}, i) => (
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
                          value={text || []}
                        />
                      </Timeline.Item>
                    ))
                  : null}
              </Timeline>
            </Panel>
          </DescriptionListItem>
          {newCommentState === CommentState.Rejected ||
          newCommentState === CommentState.PendingUserChanges ? (
            <DescriptionListItem
              label={t(
                newCommentState === CommentState.Rejected
                  ? 'comments.panels.rejectionReason'
                  : 'comments.panels.requestChangesReason'
              )}>
              <Dropdown
                title={t(
                  rejectionReason ||
                    (newCommentState === CommentState.Rejected
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
          disabled={
            isApproving ||
            isRequestingChanges ||
            isRejecting ||
            (!rejectionReason && newCommentState !== CommentState.Approved)
          }
          onClick={async () => {
            if (!comment) return
            switch (newCommentState) {
              case CommentState.Approved:
                await approveComment({
                  variables: {
                    id: comment.id
                  },
                  onCompleted: onStateChanged
                })
                setOpen(false)
                break
              case CommentState.PendingUserChanges:
                if (!rejectionReason) return
                await requestChanges({
                  variables: {
                    id: comment.id,
                    rejectionReason
                  },
                  onCompleted: onStateChanged
                })
                setOpen(false)
                break
              case CommentState.Rejected:
                if (!rejectionReason) return
                await rejectComment({
                  variables: {
                    id: comment.id,
                    rejectionReason
                  },
                  onCompleted: onStateChanged
                })
                setOpen(false)
                break
            }
          }}>
          {t(mapCommentActionToBtnTitle(newCommentState))}
        </Button>
        <Button
          onClick={() => {
            setOpen(false)
          }}
          appearance="subtle">
          {t('comments.panels.cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
