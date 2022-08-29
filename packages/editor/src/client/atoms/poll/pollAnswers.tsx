import PlusIcon from '@rsuite/icons/legacy/Plus'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Col, Form, IconButton, Message, Modal, Row, toaster} from 'rsuite'

import {
  FullPoll,
  PollAnswer,
  PollAnswerWithVoteCount,
  useCreatePollAnswerMutation,
  useDeletePollAnswerMutation
} from '../../api'

interface PollAnswersProps {
  poll?: FullPoll
  onPollUpdated(poll: FullPoll): void
  onAnswerAdded(answer: PollAnswer): Promise<void>
  onAnswerDeleted(): Promise<void>
}

export function PollAnswers({
  poll,
  onPollUpdated,
  onAnswerAdded,
  onAnswerDeleted
}: PollAnswersProps) {
  const {t} = useTranslation()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [answerToDelete, setAnswerToDelete] = useState<PollAnswerWithVoteCount | undefined>(
    undefined
  )
  const [newAnswer, setNewAnswer] = useState<string>('')
  const [createAnswerMutation, {loading}] = useCreatePollAnswerMutation()
  const [deleteAnswerMutation, {error}] = useDeletePollAnswerMutation()

  useEffect(() => {
    if (error) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    }
  }, [error])

  /**
   * FUNCTIONS
   */
  async function createAnswer() {
    if (!poll) {
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
      await onAnswerAdded(savedAnswer)
    }
  }

  async function deleteAnswer(): Promise<void> {
    setModalOpen(false)
    if (!answerToDelete) {
      return
    }
    await deleteAnswerMutation({
      variables: {
        deletePollAnswerId: answerToDelete.id
      }
    })
    await onAnswerDeleted()
  }

  async function updateAnswer(updatedAnswer: PollAnswerWithVoteCount) {
    if (!poll) {
      return
    }
    const updatedAnswers = [...(poll.answers || [])]
    const answerIndex = updatedAnswers.findIndex(tempAnswer => tempAnswer.id === updatedAnswer.id)
    if (answerIndex < 0) {
      return
    }
    updatedAnswers[answerIndex] = updatedAnswer

    const updatedPoll = {
      ...poll,
      answers: updatedAnswers
    }
    await onPollUpdated(updatedPoll)
  }

  return (
    <>
      {/* iterate poll answers */}
      <Row>
        {poll?.answers?.map((answer, index) => (
          <div key={`answer-${answer.id}`}>
            <Col xs={18}>
              <Form.Control
                name={`answer-${answer.id}`}
                value={answer.answer || t('pollEditView.defaultAnswer', {number: index + 1})}
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
