import {ApolloError} from '@apollo/client'
import PlusIcon from '@rsuite/icons/legacy/Plus'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Col, Form, IconButton, Message, Modal, Row, toaster} from 'rsuite'

import {
  FullPoll,
  PollAnswerWithVoteCount,
  PollExternalVote,
  useCreatePollAnswerMutation,
  useDeletePollAnswerMutation
} from '../../api'

interface PollAnswersProps {
  poll?: FullPoll
  onPollChange(poll: FullPoll): void
}

export function PollAnswers({poll, onPollChange}: PollAnswersProps) {
  const {t} = useTranslation()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [answerToDelete, setAnswerToDelete] = useState<PollAnswerWithVoteCount | undefined>(
    undefined
  )
  const [newAnswer, setNewAnswer] = useState<string>('')
  const [createAnswerMutation, {loading}] = useCreatePollAnswerMutation()
  const [deleteAnswerMutation] = useDeletePollAnswerMutation()

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

  /**
   * FUNCTIONS
   */
  async function createAnswer() {
    if (!poll) {
      return
    }
    if (!newAnswer) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {t('pollAnswer.answerMissing')}
        </Message>
      )
      return
    }
    const answer = await createAnswerMutation({
      variables: {
        pollId: poll.id,
        answer: newAnswer
      }
    })
    const savedAnswer = answer?.data?.createPollAnswer
    if (savedAnswer) {
      const updatedPoll = {...poll}
      updatedPoll.answers?.push(savedAnswer as PollAnswerWithVoteCount)
      onPollChange(updatedPoll)
    }
    setNewAnswer('')
  }

  async function deleteAnswer(): Promise<void> {
    setModalOpen(false)
    if (!answerToDelete) {
      return
    }
    const answer = await deleteAnswerMutation({
      variables: {
        deletePollAnswerId: answerToDelete.id
      },
      onError: onErrorToast
    })

    const updatedPoll = {...poll} as FullPoll | undefined
    // delete answer
    const deletedAnswer = answer?.data?.deletePollAnswer
    if (!deletedAnswer || !updatedPoll?.answers) {
      return
    }
    const deleteIndex = updatedPoll?.answers?.findIndex(
      tmpAnswer => tmpAnswer.id === deletedAnswer.id
    )
    if (deleteIndex < 0) {
      return
    }
    updatedPoll.answers.splice(deleteIndex, 1)

    // delete external vote sources
    updatedPoll.externalVoteSources?.forEach(tmpSource => {
      tmpSource.voteAmounts = tmpSource.voteAmounts?.filter(
        (tmpVoteAmount: PollExternalVote) => tmpVoteAmount.answerId !== deletedAnswer.id
      )
    })
    onPollChange(updatedPoll)
  }

  async function updateAnswer(updatedAnswer: PollAnswerWithVoteCount) {
    if (!poll) {
      return
    }
    const updatedAnswers = poll.answers ? [...poll.answers] : []
    const answerIndex = updatedAnswers.findIndex(tempAnswer => tempAnswer.id === updatedAnswer.id)
    if (answerIndex < 0) {
      return
    }
    updatedAnswers[answerIndex] = updatedAnswer

    onPollChange({
      ...poll,
      answers: updatedAnswers
    })
  }

  return (
    <>
      <Row>
        {poll?.answers?.map(answer => (
          <div key={`answer-${answer.id}`}>
            <Col xs={18}>
              <Form.Control
                name={`answer-${answer.id}`}
                value={answer.answer || t('pollEditView.defaultAnswer')}
                onChange={(value: string) => {
                  updateAnswer({
                    ...answer,
                    answer: value
                  })
                }}
              />
            </Col>
            {/* Delete answer */}
            <Col xs={6}>
              <IconButton
                icon={<TrashIcon />}
                circle
                size={'sm'}
                onClick={() => {
                  setAnswerToDelete(answer)
                  setModalOpen(true)
                }}
              />
            </Col>
          </div>
        ))}
      </Row>
      {/* adding new poll answer */}
      <Row>
        <Col xs={18}>
          <Form.Control
            name="createNewFormAnswer"
            placeholder={t('pollAnswer.insertYourNewAnswer')}
            value={newAnswer}
            onChange={(value: string) => {
              setNewAnswer(value)
            }}
          />
        </Col>
        <Col xs={6}>
          <Button loading={loading} appearance="primary" onClick={createAnswer}>
            <PlusIcon style={{marginRight: '5px'}} />
            {t('pollEditView.addAndSaveNewAnswer')}
          </Button>
        </Col>
      </Row>

      {/* delete modal */}
      <Modal
        open={modalOpen}
        size="xs"
        onClose={() => {
          setModalOpen(false)
        }}>
        <Modal.Title>{t('pollAnswer.deleteModalTitle')}</Modal.Title>
        <Modal.Body>{t('pollAnswer.deleteModalBody', {answer: answerToDelete?.answer})}</Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={() => deleteAnswer()}>
            {t('pollAnswer.deleteBtn')}
          </Button>
          <Button appearance="subtle" onClick={() => setModalOpen(false)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
