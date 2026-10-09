import styled from '@emotion/styled';
import {
  Badge,
  Button,
  ButtonGroup,
  IconButton as MuiIconButton,
  IconButtonProps,
  MenuItem,
  MenuList,
} from '@mui/material';
import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDropDown } from 'react-icons/md';

import { ClickPopover } from '../../popover';
import {
  CommentStateChangeModal,
  mapCommentActionToBtnTitle,
} from './commentStateChangeModal';

const BadgeWrapper = styled.div`
  margin-bottom: 5px;
`;

/** Surface for the state menu; positioning comes from the popover around it. */
const Popover = styled('div')``;
const IconButton = styled(MuiIconButton)`
  padding: 2px;
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
  size?: IconButtonProps['size'];
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

  useEffect(() => {
    setNewCommentState(comment.state);
  }, [comment]);

  const showBadge =
    comment.state === CommentState.Rejected ||
    comment.state === CommentState.PendingUserChanges;

  const renderMenu = (close: () => void) => (
    <MenuList>
      {Object.values(CommentState)
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
        ))}
    </MenuList>
  );

  return (
    <>
      {showBadge && (
        <BadgeWrapper>
          <Badge
            badgeContent={comment.rejectionReason}
            color={mapCommentStateToColor(comment.state)}
          />
        </BadgeWrapper>
      )}
      <div>
        <ButtonGroup>
          <Button
            variant="outlined"
            startIcon={<MdArrowDropDown />}
            color={mapCommentStateToColor(comment.state)}
            size={size ?? 'medium'}
          >
            {t(humanReadableCommentState(comment.state))}
          </Button>
          <ClickPopover
            trigger={
              <IconButton
                size={size ?? 'medium'}
                color={mapCommentStateToColor(comment.state)}
                title={t('comments.overview.editState')}
                aria-label={t('comments.overview.editState')}
              >
                <MdArrowDropDown />
              </IconButton>
            }
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {renderMenu}
          </ClickPopover>
        </ButtonGroup>
      </div>

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
