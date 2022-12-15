import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdArrowDropDown} from 'react-icons/md'
import {Badge, Button, ButtonGroup, Dropdown, IconButton, Popover, Whisper} from 'rsuite'
import {TypeAttributes} from 'rsuite/cjs/@types/common'

import {CommentRejectionReason, CommentState, FullCommentFragment} from '../../api'
import {CommentStateChangeModal, mapCommentActionToBtnTitle} from './commentStateChangeModal'

export function mapCommentStateToColor(commentState: CommentState) {
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

export function humanReadableCommentState(commentState: CommentState) {
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
        <div style={{marginBottom: '5px'}}>
          <Badge content={comment.rejectionReason} color={mapCommentStateToColor(comment.state)} />
        </div>
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
                <Popover ref={ref} className={className} style={{left, top}} full>
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
              style={{padding: '2px'}}
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
