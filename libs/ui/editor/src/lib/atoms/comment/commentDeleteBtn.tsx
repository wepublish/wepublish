import {ApolloError} from '@apollo/client'
import {FullCommentFragment, useDeleteCommentMutation} from '@wepublish/editor/api'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdDelete} from 'react-icons/md'
import {Button, IconButton, Message, Modal, toaster} from 'rsuite'

import {PermissionControl} from '../permissionControl'

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

interface CommentDeleteBtnProps {
  comment?: FullCommentFragment
  onCommentDeleted?(): void
}

export function CommentDeleteBtn({comment, onCommentDeleted}: CommentDeleteBtnProps) {
  const {t} = useTranslation()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [deleteComment, {loading}] = useDeleteCommentMutation({
    onCompleted: () => {
      setModalOpen(false)
      if (onCommentDeleted) {
        onCommentDeleted()
      }
    },
    onError: error => {
      setModalOpen(false)
      onErrorToast(error)
    }
  })

  if (!comment) {
    return <></>
  }

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_DELETE_COMMENTS']}>
        <IconButton
          color="red"
          appearance="ghost"
          icon={<MdDelete />}
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
