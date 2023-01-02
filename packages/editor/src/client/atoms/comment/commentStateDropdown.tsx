import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdArrowDropDown} from 'react-icons/md'
import {
  Badge,
  Button,
  ButtonGroup,
  Dropdown,
  IconButton as RIconButton,
  Popover as RPopover,
  Whisper
} from 'rsuite'
import {TypeAttributes} from 'rsuite/cjs/@types/common'

import {CommentRejectionReason, CommentState, FullCommentFragment} from '../../api'
import {CommentStateChangeModal, mapCommentActionToBtnTitle} from './commentStateChangeModal'

const BadgeWrapper = styled.div`
  margin-bottom: 5px;
`

const Popover = styled(RPopover)<{left: number; top: number}>`
  left: ${({left}) => left};
  top: ${({top}) => top};
`
const IconButton = styled(RIconButton)`
  padding: 2px;
`

function mapCommentStateToColor(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'green'
    case CommentState.PendingApproval:
    case CommentState.PendingUserChanges:
      return 'yellow'
    case CommentState.Rejected:
      return 'red'
  }
}

function humanReadableCommentState(commentState: CommentState) {
  switch (commentState) {
    case CommentState.Approved:
      return 'comments.state.approved'
    case CommentState.PendingApproval:
      return 'comments.state.pendingApproval'
    case CommentState.PendingUserChanges:
      return 'comments.state.pendingUserChanges'
    case CommentState.Rejected:
      return 'comments.state.rejected'
  }
}

interface CommentStateViewProps {
  comment: FullCommentFragment
  size?: TypeAttributes.Size
  onStateChanged?(commentState: CommentState, rejectReason?: CommentRejectionReason | null): void
}

export function CommentStateDropdown({comment, size, onStateChanged}: CommentStateViewProps) {
  const {t} = useTranslation()
  const [newCommentState, setNewCommentState] = useState<CommentState>(comment.state)

  useEffect(() => {
    setNewCommentState(comment.state)
  }, [comment])

  const showBadge =
    comment.state === CommentState.Rejected || comment.state === CommentState.PendingUserChanges

  return (
    <>
      {showBadge && (
        <BadgeWrapper>
          <Badge content={comment.rejectionReason} color={mapCommentStateToColor(comment.state)} />
        </BadgeWrapper>
      )}
      <div>
        <ButtonGroup>
          <Button
            appearance="ghost"
            color={mapCommentStateToColor(comment.state)}
            size={size || 'md'}>
            {t(humanReadableCommentState(comment.state))}
          </Button>
          <Whisper
            placement="bottomEnd"
            trigger="click"
            speaker={({onClose, left, top, className}, ref) => {
              const handleSelect = (tmpCommentState: any) => {
                onClose()
                setNewCommentState(tmpCommentState as CommentState)
              }
              return (
                <Popover ref={ref} className={className} left={left} top={top} full>
                  <Dropdown.Menu onSelect={handleSelect}>
                    {Object.keys(CommentState)
                      .filter(tmpState => tmpState !== CommentState.PendingApproval)
                      .map((tmpState, index) => (
                        <Dropdown.Item key={index} eventKey={tmpState}>
                          {t(mapCommentActionToBtnTitle(tmpState as CommentState))}
                        </Dropdown.Item>
                      ))}
                  </Dropdown.Menu>
                </Popover>
              )
            }}>
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
            onStateChanged(commentState, rejectReason)
          }
        }}
        onClose={() => setNewCommentState(comment.state)}
      />
    </>
  )
}
