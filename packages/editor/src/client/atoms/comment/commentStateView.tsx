import ArrowDownIcon from '@rsuite/icons/legacy/ArrowDown'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, ButtonGroup, Dropdown, IconButton, Popover, Whisper} from 'rsuite'
import {TypeAttributes} from 'rsuite/cjs/@types/common'

import {CommentState, FullCommentFragment} from '../../api'
import {IconButtonTooltip} from '../iconButtonTooltip'
import {CommentStateChangeModal} from './commentStateChangeModal'

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

interface CommentStateViewProps {
  comment: FullCommentFragment
  size?: TypeAttributes.Size
  onStateChanged?(): void
}

export function CommentStateView({comment, size, onStateChanged}: CommentStateViewProps) {
  const {t} = useTranslation()
  const [newCommentState, setNewCommentState] = useState<CommentState>(comment.state)
  if (!comment) {
    return <></>
  }
  return (
    <>
      <ButtonGroup>
        <Button
          appearance="ghost"
          color={mapCommentStateToColor(comment.state)}
          size={size || 'md'}>
          {comment.state}
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
                  {Object.keys(CommentState).map((tmpState, index) => (
                    <IconButtonTooltip key={index} caption={t('comments.overview.approve')}>
                      <Dropdown.Item eventKey={tmpState}>{tmpState}</Dropdown.Item>
                    </IconButtonTooltip>
                  ))}
                </Dropdown.Menu>
              </Popover>
            )
          }}>
          <IconButton
            size={size || 'md'}
            appearance="primary"
            color={mapCommentStateToColor(comment.state)}
            icon={<ArrowDownIcon />}
          />
        </Whisper>
      </ButtonGroup>

      {/* modal */}
      <CommentStateChangeModal
        comment={comment}
        newCommentState={newCommentState}
        onStateChanged={onStateChanged}
      />
    </>
  )
}
