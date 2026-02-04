import styled from '@emotion/styled';
import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api-v2';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDropDown } from 'react-icons/md';
import {
  Badge,
  ButtonGroup,
  Dropdown,
  IconButton as RIconButton,
  Popover as RPopover,
  Whisper,
} from 'rsuite';
import { TypeAttributes } from 'rsuite/cjs/@types/common';

import {
  CommentStateChangeModal,
  mapCommentActionToBtnTitle,
} from './commentStateChangeModal';

const BadgeWrapper = styled.div`
  margin-bottom: 5px;
`;

const Popover = styled(RPopover)<{ left: number; top: number }>`
  left: ${({ left }) => left};
  top: ${({ top }) => top};
`;
const IconButton = styled(RIconButton)`
  padding: 2px;
`;

export function mapCommentStateToColor(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'green';
    case CommentState.PendingApproval:
    case CommentState.PendingUserChanges:
      return 'yellow';
    case CommentState.Rejected:
      return 'red';
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
  size?: TypeAttributes.Size;
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

  const renderMenu = (
    { onClose, className }: { className: any; onClose: () => void },
    ref: any
  ) => {
    const handleSelect = (eventKey: string | undefined) => {
      onClose();
      if (eventKey) {
        setNewCommentState(eventKey as CommentState);
      }
    };

    return (
      <RPopover
        ref={ref}
        className={className}
        full
      >
        <Dropdown.Menu onSelect={handleSelect}>
          {Object.values(CommentState)
            .filter(tmpState => tmpState !== CommentState.PendingApproval)
            .map((tmpState, index) => (
              <Dropdown.Item
                key={index}
                eventKey={tmpState}
              >
                {t(mapCommentActionToBtnTitle(tmpState))}
              </Dropdown.Item>
            ))}
        </Dropdown.Menu>
      </RPopover>
    );
  };

  return (
    <>
      {showBadge && (
        <BadgeWrapper>
          <Badge
            content={comment.rejectionReason}
            color={mapCommentStateToColor(comment.state)}
          />
        </BadgeWrapper>
      )}
      <div>
        <ButtonGroup>
          <IconButton
            appearance="ghost"
            icon={<MdArrowDropDown />}
            placement="left"
            color={mapCommentStateToColor(comment.state)}
            size={size || 'md'}
          >
            {t(humanReadableCommentState(comment.state))}
          </IconButton>
          <Whisper
            placement="bottomEnd"
            trigger="click"
            speaker={renderMenu}
          >
            <IconButton
              size={size || 'md'}
              appearance="primary"
              color={mapCommentStateToColor(comment.state)}
              icon={<MdArrowDropDown />}
            />
          </Whisper>
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
