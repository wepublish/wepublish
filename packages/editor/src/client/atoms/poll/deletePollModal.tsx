import {ApolloQueryResult} from '@apollo/client'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Message, Modal, toaster} from 'rsuite'

import {FullPoll, PollsQuery, useDeletePollMutation} from '../../api'

interface deletePollProps {
  poll?: FullPoll
  setPol(poll: FullPoll | undefined): void
  afterDelete(): Promise<ApolloQueryResult<PollsQuery>>
}

export function DeletePollModal({poll, setPol, afterDelete}: deletePollProps) {
  const {t} = useTranslation()
  const [deletePollMutation] = useDeletePollMutation()
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!poll) {
      setOpen(false)
      return
    }
    // open
    setOpen(true)
  }, [poll])

  /**
   * FUNCTIONS
   */
  async function deletePoll() {
    if (!poll) {
      return
    }
    // close modal
    setOpen(false)
    // call api
    await deletePollMutation({
      variables: {
        deletePollId: poll.id
      }
    })
    // inform user
    toaster.push(
      <Message type="success" showIcon closable duration={3000}>
        {t('pollList.pollDeleted')}
      </Message>
    )

    await afterDelete()
  }

  return (
    <>
      <Modal open={open}>
        <Modal.Header>
          <Modal.Title>{t('deletePollModal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('deletePollModal.body', {pollQuestion: poll?.question || t('pollList.noQuestion')})}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={deletePoll} appearance="primary">
            {t('deletePollModal.deleteBtn')}
          </Button>
          <Button onClick={() => setPol(undefined)} appearance="subtle">
            {t('deletePollModal.cancelBtn')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
