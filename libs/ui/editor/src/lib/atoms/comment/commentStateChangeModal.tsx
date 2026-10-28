import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
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
import { TFunction } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdExpandMore } from 'react-icons/md';

import { enqueueSnackbar } from '../../snackbar';

const ParentComment = styled.div`
  padding-left: ${({ theme }) => theme.spacing(1.5)};
  border-left: 3px solid ${({ theme }) => theme.vars.palette.divider};
`;

const ClampedText = styled(Typography)`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CommentText = styled(Paper)`
  max-height: 40vh;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(2)};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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

function printUsername(
  comment: Pick<FullCommentFragment, 'user' | 'guestUsername'>,
  t: TFunction
) {
  return comment.user?.name ?
      comment.user.name
    : `${comment.guestUsername || t('comments.panels.noUserName')} ${t(
        'comments.panels.unregisteredUser'
      )}`;
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
        if (!rejectionReason) {
          return;
        }

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
        onClose?.();
        break;
    }
  }

  const [latestRevision, ...earlierRevisions] = useMemo(
    () =>
      [...comment.revisions].sort(
        (a: CommentRevisionFragment, b: CommentRevisionFragment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [comment.revisions]
  );

  const open = Boolean(comment) && comment.state !== newCommentState;
  const needsReason =
    newCommentState === CommentState.Rejected ||
    newCommentState === CommentState.PendingUserChanges;
  const isSaving = isApproving || isRequestingChanges || isRejecting;

  const parent = comment.parentComment;
  const parentRevision = parent?.revisions[parent.revisions.length - 1];

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="sm"
      onClose={() => onClose?.()}
      aria-labelledby="comment-state-change-title"
    >
      <DialogTitle id="comment-state-change-title">
        {t(mapModalTitle(newCommentState))}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {parent && (
            <ParentComment>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                {t('comments.panels.inReplyTo', {
                  name: printUsername(parent, t),
                })}
              </Typography>
              <ClampedText
                variant="body2"
                color="text.secondary"
              >
                {toPlaintext(parentRevision?.text?.content)}
              </ClampedText>
            </ParentComment>
          )}

          <div>
            <Typography
              variant="subtitle2"
              component="div"
            >
              {printUsername(comment, t)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              component="div"
            >
              {t('comments.panels.createdAtDate', {
                createdAtDate: new Date(comment.createdAt),
              })}
            </Typography>
          </div>

          <CommentText variant="outlined">
            <Typography variant="body1">
              {toPlaintext(latestRevision?.text?.content)}
            </Typography>
          </CommentText>

          {earlierRevisions.length > 0 && (
            <Accordion
              variant="outlined"
              disableGutters
            >
              <AccordionSummary expandIcon={<MdExpandMore />}>
                <Typography variant="body2">
                  {t('comments.panels.earlierRevisions', {
                    count: earlierRevisions.length,
                  })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack
                  spacing={2}
                  divider={<Divider flexItem />}
                >
                  {earlierRevisions.map(({ text, createdAt }) => (
                    <div key={createdAt}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        {t('comments.panels.revisionCreatedAtDate', {
                          revisionCreatedAtDate: new Date(createdAt),
                        })}
                      </Typography>
                      <Typography variant="body2">
                        {toPlaintext(text?.content)}
                      </Typography>
                    </div>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {needsReason && (
            <TextField
              select
              required
              fullWidth
              label={t(
                newCommentState === CommentState.Rejected ?
                  'comments.panels.rejectionReason'
                : 'comments.panels.requestChangesReason'
              )}
              value={rejectionReason ?? ''}
              onChange={event =>
                setRejectionReason(event.target.value as CommentRejectionReason)
              }
            >
              {[
                CommentRejectionReason.Spam,
                CommentRejectionReason.Misconduct,
              ].map(reason => (
                <MenuItem
                  key={reason}
                  value={reason}
                >
                  {t(mapRejectionReasonToLabel(reason))}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
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
          color={
            newCommentState === CommentState.Rejected ? 'error' : 'primary'
          }
          loading={isSaving}
          disabled={needsReason && !rejectionReason}
          onClick={async () => await changeState()}
        >
          {t(mapCommentActionToBtnTitle(newCommentState))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
