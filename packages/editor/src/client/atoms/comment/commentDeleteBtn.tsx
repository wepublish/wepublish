import {ApolloError} from '@apollo/client'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, IconButton, Message, Modal, toaster} from 'rsuite'

import {FullCommentFragment, useDeleteCommentMutation} from '../../api'
import {PermissionControl} from '../permissionControl'

interface CommentDeleteBtnProps {
  comment?: FullCommentFragment
  onCommentDeleted?(): void
}

export function CommentDeleteBtn({comment, onCommentDeleted}: CommentDeleteBtnProps) {
  if (!comment) {
    return <></>
  }

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

  const {t} = useTranslation()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [deleteComment, {loading}] = useDeleteCommentMutation({
    onCompleted: () => {
      setModalOpen(false)
      if (onCommentDeleted) {
        onCommentDeleted()
      }
    },
    onError: onErrorToast
  })

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_DELETE_COMMENTS']}>
        <IconButton
          color="red"
          appearance="ghost"
          icon={<TrashIcon />}
          onClick={() => setModalOpen(true)}
          loading={loading}>
          {t('delete')}
        </IconButton>
      </PermissionControl>

      <Modal open={modalOpen}>
        <Modal.Title>{t('commentDeleteBtn.modalTitle')}</Modal.Title>
        <Modal.Body>{t('commentDeleteBtn.modalBody')}</Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="ghost"
            onClick={async () => {
              await deleteComment({
                variables: {
                  deleteCommentId: comment.id
                }
              })
            }}
            loading={loading}>
            {t('delete')}
          </Button>
          <Button onClick={() => setModalOpen(false)} appearance="primary" loading={loading}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
