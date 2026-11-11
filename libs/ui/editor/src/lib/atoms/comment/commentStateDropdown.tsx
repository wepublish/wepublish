import styled from '@emotion/styled';
import { Button, ButtonProps, MenuItem, Typography } from '@mui/material';
import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDropDown } from 'react-icons/md';

import { useSeededState } from '../../hooks/use-seeded-state';
import { ClickMenu } from '../../popover';
import {
  CommentStateChangeModal,
  mapCommentActionToBtnTitle,
  mapRejectionReasonToLabel,
} from './commentStateChangeModal';

const State = styled.div`
  display: inline-grid;
  justify-items: start;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export function mapCommentStateToColor(
  commentState: CommentState
): 'success' | 'warning' | 'error' | undefined {
  switch (commentState) {
    case CommentState.Approved:
      return 'success';
    case CommentState.PendingApproval:
    case CommentState.PendingUserChanges:
      return 'warning';
    case CommentState.Rejected:
      return 'error';
  }
}

export function humanReadableCommentState(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.state.approved';
    case CommentState.PendingApproval:
      return 'comments.state.pendingApproval';
    case CommentState.PendingUserChanges:
      return 'comments.state.pendingUserChanges';
    case CommentState.Rejected:
      return 'comments.state.rejected';
  }
}

interface CommentStateViewProps {
  comment: FullCommentFragment;
  size?: ButtonProps['size'];
  onStateChanged?(
    commentState: CommentState,
    rejectReason?: CommentRejectionReason | null
  ): void;
}

export function CommentStateDropdown({
  comment,
  size,
  onStateChanged,
}: CommentStateViewProps) {
  const { t } = useTranslation();
  const [newCommentState, setNewCommentState] = useState<CommentState>(
    comment.state
  );

  useSeededState(comment, ({ state }) => setNewCommentState(state));

  const rejectionReason =
    (
      comment.state === CommentState.Rejected ||
      comment.state === CommentState.PendingUserChanges
    ) ?
      comment.rejectionReason
    : null;

  return (
    <>
      <State>
        {/*
          One control: the button says which state the comment is in and opens
          the states. It used to be a `ButtonGroup` of a button that showed the
          state and did nothing, plus an icon button carrying the same caret.

          `ClickMenu` rather than `ClickPopover`, which pads its paper for
          free-form content and left the items inset inside a second box.
        */}
        <ClickMenu
          trigger={
            <Button
              variant="outlined"
              endIcon={<MdArrowDropDown />}
              color={mapCommentStateToColor(comment.state)}
              size={size ?? 'medium'}
              title={t('comments.overview.editState')}
            >
              {t(humanReadableCommentState(comment.state))}
            </Button>
          }
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {close =>
            Object.values(CommentState)
              .filter(tmpState => tmpState !== CommentState.PendingApproval)
              .map(tmpState => (
                <MenuItem
                  key={tmpState}
                  onClick={() => {
                    close();
                    setNewCommentState(tmpState);
                  }}
                >
                  {t(mapCommentActionToBtnTitle(tmpState))}
                </MenuItem>
              ))
          }
        </ClickMenu>

        {rejectionReason && (
          <Typography
            variant="caption"
            color={`${mapCommentStateToColor(comment.state)}.main`}
          >
            {t(mapRejectionReasonToLabel(rejectionReason))}
          </Typography>
        )}
      </State>

      {/* modal */}
      <CommentStateChangeModal
        comment={comment}
        newCommentState={newCommentState}
        onStateChanged={(commentState, rejectReason) => {
          if (onStateChanged) {
            onStateChanged(commentState, rejectReason);
          }
        }}
        onClose={() => setNewCommentState(comment.state)}
      />
    </>
  );
}
