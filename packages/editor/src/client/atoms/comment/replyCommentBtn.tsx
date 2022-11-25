import {ApolloError} from '@apollo/client'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {MdOutlineMoveToInbox} from 'react-icons/md'
import {useNavigate} from 'react-router-dom'
import {IconButton, Message, toaster} from 'rsuite'
import {TypeAttributes} from 'rsuite/cjs/@types/common'

import {FullCommentFragment, useCreateCommentMutation} from '../../api'
import {IconButtonTooltip} from '../iconButtonTooltip'

interface ReplyCommentBtnProps {
  comment?: FullCommentFragment
  circle?: boolean
  size?: TypeAttributes.Size
  color?: TypeAttributes.Color
  appearance?: TypeAttributes.Appearance
  hideText?: boolean
}

export function ReplyCommentBtn({
  comment,
  circle,
  size,
  color,
  appearance,
  hideText
}: ReplyCommentBtnProps) {
  const {t} = useTranslation()
  const navigate = useNavigate()

  const onError = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

  const [createComment] = useCreateCommentMutation({
    onError
  })

  async function replyToComment() {
    if (!comment) {
      return
    }
    await createComment({
      variables: {
        itemID: comment.itemID,
        itemType: comment.itemType,
        parentID: comment.id
      },
      onCompleted: data => {
        navigate(`/comments/edit/${data?.createComment.id}`)
      }
    })
  }

  function getIconBtn() {
    if (hideText) {
      return (
        <IconButton
          icon={<MdOutlineMoveToInbox />}
          size={size}
          circle={circle}
          color={color}
          appearance={appearance}
          onClick={async () => {
            await replyToComment()
          }}
        />
      )
    }
    return (
      <IconButton
        icon={<MdOutlineMoveToInbox />}
        size={size}
        circle={circle}
        color={color}
        appearance={appearance}
        onClick={async () => {
          await replyToComment()
        }}>
        {t('replyCommentBtn.reply')}
      </IconButton>
    )
  }

  return (
    <IconButtonTooltip caption={t('replyCommentBtn.tooltip')}>{getIconBtn()}</IconButtonTooltip>
  )
}
