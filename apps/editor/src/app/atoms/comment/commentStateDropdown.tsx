import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdArrowDropDown} from 'react-icons/md'
import {Dropdown, IconButton, Popover, Whisper} from 'rsuite'
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

  const renderMenu = ({onClose, className}: {className: any; onClose: () => void}, ref: any) => {
    const handleSelect = (eventKey: string | undefined) => {
      onClose()
      if (eventKey) {
        setNewCommentState(eventKey as CommentState)
      }
    }

    return (
      <Popover ref={ref} className={className} full>
        <Dropdown.Menu onSelect={handleSelect}>
          {Object.keys(CommentState)
            .filter(tmpState => tmpState !== CommentState.PendingApproval)
            .map((tmpState, index) => (
              <Dropdown.Item
                key={index}
                eventKey={tmpState}
                /* onClick={() => setNewCommentState(tmpState as CommentState)} */
              >
                {t(mapCommentActionToBtnTitle(tmpState as CommentState))}
              </Dropdown.Item>
            ))}
        </Dropdown.Menu>
      </Popover>
    )
  }

  return (
    <>
      <div>
        <Whisper placement="bottomStart" trigger="click" speaker={renderMenu}>
          <IconButton
            appearance="ghost"
            icon={<MdArrowDropDown />}
            placement="left"
            color={mapCommentStateToColor(comment.state)}
            size={size}>
            {t(humanReadableCommentState(comment.state))}
          </IconButton>
        </Whisper>
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
