import PlusIcon from '@rsuite/icons/legacy/Plus'
import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {Button, Message, toaster} from 'rsuite'

import {useCreatePollMutation} from '../../api'

export function CreatePollBtn() {
  const [createPollMutation, {error, data: newPoll, loading}] = useCreatePollMutation()
  const navigate = useNavigate()
  const {t} = useTranslation()

  /**
   * Forward user to new created poll
   */
  useEffect(() => {
    if (newPoll?.createPoll?.id) {
      navigate(`/polls/edit/${newPoll.createPoll.id}`)
    }
  }, [newPoll])

  /**
   * I error was thrown during poll creation, show it to the user.
   */
  useEffect(() => {
    if (error?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    }
  }, [error])

  return (
    <Button
      appearance="primary"
      color="green"
      size="lg"
      onClick={async () => {
        await createPollMutation()
      }}
      loading={loading}>
      <PlusIcon style={{marginRight: '5px'}} />
      {t('pollList.createNew')}
    </Button>
  )
}
