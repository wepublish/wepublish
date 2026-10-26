import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import {
  ApproveCommentDocument,
  CommentRejectionReason,
  CommentRevisionFragment,
  CommentState,
  FullCommentFragment,
  RejectCommentDocument,
  RequestChangesOnCommentDocument,
} from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDropDown, MdReplay } from 'react-icons/md';

import { ClickMenu } from '../../popover/click-menu';
import { enqueueSnackbar } from '../../snackbar';
import { DescriptionList, DescriptionListItem } from '../descriptionList';

const ParentCommentPanel = styled(Card)`
  margin-right: 40px;
  font-style: italic;
  color: lightslategrey;
`;

const IconWrapper = styled.div`
  margin-top: 8px;
  margin-left: 10px;
`;

const RevisionPanel = styled(Card)`
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

export function mapRejectionReasonToLabel(
  rejectionReason: CommentRejectionReason
) {
  switch (rejectionReason) {
    case CommentRejectionReason.Spam:
      return 'comments.panels.rejectionReasons.spam';
    case CommentRejectionReason.Misconduct:
      return 'comments.panels.rejectionReasons.misconduct';
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
  const [rejectionReason, setRejectionReason] =
    useState<CommentRejectionReason>();

  const [approveComment, { loading: isApproving, error: errorApprove }] =
    useMutation(ApproveCommentDocument);
  const [
    requestChanges,
    { loading: isRequestingChanges, error: errorRequestingChanges },
  ] = useMutation(RequestChangesOnCommentDocument);
  const [rejectComment, { loading: isRejecting, error: errorRejecting }] =
    useMutation(RejectCommentDocument);

  useEffect(() => {
    const error =
      errorApprove?.message ??
      errorRequestingChanges?.message ??
      errorRejecting?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [errorApprove, errorRequestingChanges, errorRejecting]);

  async function changeState() {
    if (!comment) {
      return;
    }
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
        onClose?.();
        break;
      case CommentState.PendingUserChanges:
        if (!rejectionReason) {
          return;
        }

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
        onClose?.();
        break;
      case CommentState.Rejected:
        await rejectComment({
          variables: {
            id: comment.id,
            rejectionReason:
              rejectionReason ?? CommentRejectionReason.Misconduct,
          },
          onCompleted: data => {
            if (onStateChanged) {
              const comment = data.rejectComment;
              onStateChanged(comment.state, comment.rejectionReason);
            }
          },
        });
        onClose?.();
        break;
    }
  }

  const sortedRevisions = useMemo(() => {
    const dcRevisions = [...comment.revisions];
    return dcRevisions.sort(
      (a: CommentRevisionFragment, b: CommentRevisionFragment) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comment.revisions]);

  const open = Boolean(comment) && comment.state !== newCommentState;

  const printUsername =
    comment?.user?.name ?
      `${comment.user.name}`
    : `${comment?.guestUsername || t('comments.panels.noUserName')} ${t(
        'comments.panels.unregisteredUser'
      )}`;

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="sm"
      onClose={() =>
        !(isApproving || isRequestingChanges || isRejecting) && onClose?.()
      }
    >
      <DialogTitle>{t(mapModalTitle(newCommentState))}</DialogTitle>
      <DialogContent>
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
              <ParentCommentPanel>
                <CardContent>
                  <CardContent>
                    <>
                      <div>
                        {t('comments.panels.parentDate', {
                          parentDate: new Date(comment.parentComment.createdAt),
                        })}
                      </div>
                      <Typography>{printUsername}:</Typography>

                      {toPlaintext(
                        comment.parentComment.revisions[
                          comment.parentComment.revisions.length - 1
                        ]?.text?.content
                      )}
                    </>
                  </CardContent>
                </CardContent>
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
              <ClickMenu
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                trigger={
                  <Button
                    variant="outlined"
                    endIcon={<MdArrowDropDown />}
                  >
                    {t(
                      rejectionReason ?
                        mapRejectionReasonToLabel(rejectionReason)
                      : newCommentState === CommentState.Rejected ?
                        'comments.panels.rejectionReason'
                      : 'comments.panels.requestChangesReason'
                    )}
                  </Button>
                }
              >
                {close =>
                  [
                    CommentRejectionReason.Spam,
                    CommentRejectionReason.Misconduct,
                  ].map(reason => (
                    <MenuItem
                      key={reason}
                      onClick={() => {
                        setRejectionReason(reason);
                        close();
                      }}
                    >
                      {t(mapRejectionReasonToLabel(reason))}
                    </MenuItem>
                  ))
                }
              </ClickMenu>
            </DescriptionListItem>
          : null}

          <DescriptionListItem label={t('comments.panels.revisions')} />
          <RevisionPanel>
            <CardContent>
              <CardContent>
                <Stack
                  direction="column"
                  spacing={2}
                  divider={<Divider flexItem />}
                >
                  {sortedRevisions.map(({ text, createdAt }, index) => (
                    <div key={`revision-${index}`}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        {t('comments.panels.revisionCreatedAtDate', {
                          revisionCreatedAtDate: new Date(createdAt),
                        })}
                      </Typography>

                      {toPlaintext(text?.content)}
                    </div>
                  ))}
                </Stack>
              </CardContent>
            </CardContent>
          </RevisionPanel>
        </DescriptionList>
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={() => onClose?.()}
        >
          {t('comments.panels.cancel')}
        </Button>

        <Button
          variant="contained"
          disabled={isApproving || isRequestingChanges || isRejecting}
          onClick={async () => await changeState()}
        >
          {t(mapCommentActionToBtnTitle(newCommentState))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
