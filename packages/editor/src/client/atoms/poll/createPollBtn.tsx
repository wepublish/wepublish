import {ApolloError} from '@apollo/client'
import PlusIcon from '@rsuite/icons/legacy/Plus'
import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {Button, Message, toaster} from 'rsuite'

import {useCreatePollMutation} from '../../api'

export function CreatePollBtn() {
  const [createPollMutation, {data: newPoll, loading}] = useCreatePollMutation()
  const navigate = useNavigate()
  const {t} = useTranslation()

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

  /**
   * Forward user to new created poll
   */
  useEffect(() => {
    if (newPoll?.createPoll?.id) {
      navigate(`/polls/edit/${newPoll.createPoll.id}`)
    }
  }, [newPoll])

  async function createPoll() {
    await createPollMutation({
      onError: onErrorToast
    })
  }

  return (
    <Button appearance="primary" color="green" size="lg" onClick={createPoll} loading={loading}>
      <PlusIcon style={{marginRight: '5px'}} />
      {t('pollList.createNew')}
    </Button>
  )
}
