import styled from '@emotion/styled';
import {
  CommentRejectionReason,
  CommentRevision,
  CommentState,
  FullCommentFragment,
  useApproveCommentMutation,
  useRejectCommentMutation,
  useRequestChangesOnCommentMutation,
} from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdReplay } from 'react-icons/md';
import {
  Button,
  Dropdown,
  Message,
  Modal,
  Panel,
  Timeline,
  toaster,
} from 'rsuite';

import { RichTextBlock } from '../../blocks/richTextBlock/rich-text-block';
import { DescriptionList, DescriptionListItem } from '../descriptionList';

const ParentCommentPanel = styled(Panel)`
  margin-right: 40px;
  font-style: italic;
  color: lightslategrey;
`;

const IconWrapper = styled.div`
  margin-top: 8px;
  margin-left: 10px;
`;

const RevisionPanel = styled(Panel)`
  max-height: 300px;
  overflow-y: scroll;
`;

function mapModalTitle(commentState: CommentState): string {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.panels.approveComment';
    case CommentState.Rejected:
      return 'comments.panels.rejectComment';
    case CommentState.PendingUserChanges:
    case CommentState.PendingApproval:
      return 'comments.panels.requestChangesOnComment';
  }
}

export function mapCommentActionToBtnTitle(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.panels.approve';
    case CommentState.PendingUserChanges:
    case CommentState.PendingApproval:
      return 'comments.panels.requestChanges';
    case CommentState.Rejected:
      return 'comments.panels.reject';
  }
}

interface CommentStateChangeModalProps {
  comment: FullCommentFragment;
  newCommentState: CommentState;
  onStateChanged?(
    commentState: CommentState,
    rejectionReason?: CommentRejectionReason | null
  ): void;
  onClose?(): void;
}

export function CommentStateChangeModal({
  comment,
  newCommentState,
  onStateChanged,
  onClose,
}: CommentStateChangeModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] =
    useState<CommentRejectionReason>();
  const [approveComment, { loading: isApproving, error: errorApprove }] =
    useApproveCommentMutation();
  const [
    requestChanges,
    { loading: isRequestingChanges, error: errorRequestingChanges },
  ] = useRequestChangesOnCommentMutation();
  const [rejectComment, { loading: isRejecting, error: errorRejecting }] =
    useRejectCommentMutation();

  useEffect(() => {
    const error =
      errorApprove?.message ??
      errorRequestingChanges?.message ??
      errorRejecting?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [errorApprove, errorRequestingChanges, errorRejecting]);

  async function changeState() {
    if (!comment) return;
    switch (newCommentState) {
      case CommentState.Approved:
        await approveComment({
          variables: {
            id: comment.id,
          },
          onCompleted: data => {
            if (onStateChanged) {
              onStateChanged(data.approveComment.state);
            }
          },
        });
        setOpen(false);
        break;
      case CommentState.PendingUserChanges:
        if (!rejectionReason) return;
        await requestChanges({
          variables: {
            id: comment.id,
            rejectionReason,
          },
          onCompleted: data => {
            if (onStateChanged) {
              const comment = data.requestChangesOnComment;
              onStateChanged(comment.state, comment.rejectionReason);
            }
          },
        });
        setOpen(false);
        break;
      case CommentState.Rejected:
        await rejectComment({
          variables: {
            id: comment.id,
            rejectionReason,
          },
          onCompleted: data => {
            if (onStateChanged) {
              const comment = data.rejectComment;
              onStateChanged(comment.state, comment.rejectionReason);
            }
          },
        });
        setOpen(false);
        break;
    }
  }

  const sortedRevisions = useMemo(() => {
    const dcRevisions = [...comment.revisions];
    return dcRevisions.sort(
      (a: CommentRevision, b: CommentRevision) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comment.revisions]);

  // handling the modal visibility
  useEffect(() => {
    if (comment && comment.state !== newCommentState) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [newCommentState]);

  useEffect(() => {
    if (!open && onClose) {
      onClose();
    }
  }, [open]);

  const printUsername =
    comment?.user?.name ?
      `${comment.user.name}`
    : `${comment?.guestUsername || t('comments.panels.noUserName')} ${t(
        'comments.panels.unregisteredUser'
      )}`;

  return (
    <Modal
      open={open}
      size="sm"
      overflow
    >
      <Modal.Header onClose={() => setOpen(false)}>
        <Modal.Title>
          <div>{t(mapModalTitle(newCommentState))}</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DescriptionList>
          <DescriptionListItem label={t('comments.panels.id')}>
            {comment?.id}
          </DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.userName')}>
            {printUsername}
          </DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.createdAt')}>
            {comment?.createdAt &&
              t('comments.panels.createdAtDate', {
                createdAtDate: new Date(comment?.createdAt),
              })}
          </DescriptionListItem>
          <DescriptionListItem label={t('comments.panels.updatedAt')}>
            {comment?.modifiedAt &&
              t('comments.panels.modifiedAt', {
                modifiedAt: new Date(comment.modifiedAt),
              })}
          </DescriptionListItem>

          {comment?.parentComment && (
            <DescriptionListItem label={t('comments.panels.parent')}>
              <ParentCommentPanel bordered>
                <>
                  <div>
                    {t('comments.panels.parentDate', {
                      parentDate: new Date(comment.parentComment.createdAt),
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
                      comment.parentComment.revisions[
                        comment.parentComment.revisions.length - 1
                      ]?.text || []
                    }
                  />
                </>
              </ParentCommentPanel>
              <IconWrapper>
                <MdReplay rotate={180} />
              </IconWrapper>
            </DescriptionListItem>
          )}

          {(
            newCommentState === CommentState.Rejected ||
            newCommentState === CommentState.PendingUserChanges
          ) ?
            <DescriptionListItem
              label={t(
                newCommentState === CommentState.Rejected ?
                  'comments.panels.rejectionReason'
                : 'comments.panels.requestChangesReason'
              )}
            >
              <Dropdown
                title={t(
                  rejectionReason ||
                    (newCommentState === CommentState.Rejected ?
                      'comments.panels.rejectionReason'
                    : 'comments.panels.requestChangesReason')
                )}
                placement="topEnd"
              >
                <Dropdown.Item
                  key={CommentRejectionReason.Spam}
                  active={CommentRejectionReason.Spam === rejectionReason}
                  onSelect={() =>
                    setRejectionReason(CommentRejectionReason.Spam)
                  }
                >
                  {CommentRejectionReason.Spam}
                </Dropdown.Item>
                <Dropdown.Item
                  key={CommentRejectionReason.Misconduct}
                  active={CommentRejectionReason.Misconduct === rejectionReason}
                  onSelect={() => {
                    setRejectionReason(CommentRejectionReason.Misconduct);
                  }}
                >
                  {CommentRejectionReason.Misconduct}
                </Dropdown.Item>
              </Dropdown>
            </DescriptionListItem>
          : null}

          <DescriptionListItem label={t('comments.panels.revisions')} />
          <RevisionPanel bordered>
            <Timeline align="left">
              {sortedRevisions.length ?
                sortedRevisions.map(({ text, createdAt }, index) => (
                  <Timeline.Item
                    key={`timeline-item-${index}`}
                    className={index === 0 ? 'rs-timeline-item-last' : ''}
                  >
                    <div>
                      {t('comments.panels.revisionCreatedAtDate', {
                        revisionCreatedAtDate: new Date(createdAt),
                      })}
                    </div>
                    <RichTextBlock
                      disabled
                      displayOnly
                      onChange={() => {
                        return undefined;
                      }}
                      value={text || []}
                    />
                  </Timeline.Item>
                ))
              : null}
            </Timeline>
          </RevisionPanel>
        </DescriptionList>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={isApproving || isRequestingChanges || isRejecting}
          appearance={'primary'}
          onClick={async () => await changeState()}
        >
          {t(mapCommentActionToBtnTitle(newCommentState))}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
          }}
          appearance="subtle"
        >
          {t('comments.panels.cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
