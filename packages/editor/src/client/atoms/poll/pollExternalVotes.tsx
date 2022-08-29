import PlusIcon from '@rsuite/icons/legacy/Plus'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Col, IconButton, Message, Modal, Row, Table, toaster} from 'rsuite'
import FormControl from 'rsuite/FormControl'

import {
  FullPoll,
  PollAnswerWithVoteCount,
  PollExternalVote,
  PollExternalVoteSource,
  useCreatePollExternalVoteSourceMutation,
  useDeletePollExternalVoteSourceMutation
} from '../../api'

interface PollExternalVotesProps {
  poll?: FullPoll
  onExternalSourceCreated(): Promise<void>
  onExternalSourceDeleted(): Promise<void>
}

export function PollExternalVotes({
  poll,
  onExternalSourceCreated,
  onExternalSourceDeleted
}: PollExternalVotesProps) {
  const {t} = useTranslation()
  const [newSource, setNewSource] = useState<string | undefined>(undefined)
  const [sourceToDelete, setSourceToDelete] = useState<PollExternalVoteSource | undefined>(
    undefined
  )
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [createPollMutation, {loading}] = useCreatePollExternalVoteSourceMutation({
    fetchPolicy: 'no-cache'
  })
  const [deletePollMutation] = useDeletePollExternalVoteSourceMutation({
    fetchPolicy: 'no-cache'
  })

  async function createPoll() {
    if (!newSource) {
      toaster.push(
        <Message showIcon type="error" closable duration={3000}>
          {t('pollExternalVotes.emptySource')}
        </Message>
      )
      return
    }
    if (!poll) {
      toaster.push(
        <Message showIcon type="error" closable duration={3000}>
          {t('pollExternalVotes.noPollAvailable')}
        </Message>
      )
      return
    }
    await createPollMutation({
      variables: {
        pollId: poll.id,
        source: newSource
      }
    })
    setNewSource(undefined)
    await onExternalSourceCreated()
  }

  async function deletePoll() {
    const id = sourceToDelete?.id
    if (!id) {
      return
    }
    await deletePollMutation({
      variables: {
        deletePollExternalVoteSourceId: id
      }
    })
    setSourceToDelete(undefined)
    setOpenModal(false)
    await onExternalSourceDeleted()
  }

  /**
   * UI HELPER FUNCTIONS
   */
  function tableView() {
    if (!poll?.externalVoteSources?.length) {
      return
    }
    return (
      <>
        <Table data={poll?.externalVoteSources || []} loading={loading} autoHeight>
          {/* source columns */}
          <Table.Column>
            <Table.HeaderCell>{t('pollExternalVotes.sourceHeaderCell')}</Table.HeaderCell>
            <Table.Cell>{(voteSource: any) => voteSource.source}</Table.Cell>
          </Table.Column>
          {/* iterate answer columns */}
          {iterateAnswerColumns()}
          {/* delete button */}
          <Table.Column>
            <Table.HeaderCell>{t('pollExternalVotes.deleteExternalVote')}</Table.HeaderCell>
            <Table.Cell>
              {(voteSource: PollExternalVoteSource) => (
                <IconButton
                  icon={<TrashIcon />}
                  onClick={() => {
                    setOpenModal(true)
                    setSourceToDelete(voteSource)
                  }}
                />
              )}
            </Table.Cell>
          </Table.Column>
        </Table>
      </>
    )
  }

  function iterateAnswerColumns() {
    return poll?.answers?.map((answer: PollAnswerWithVoteCount) => (
      <Table.Column key={answer.id}>
        <Table.HeaderCell>{answer.answer}</Table.HeaderCell>
        <Table.Cell>
          {(externalVoteSource: PollExternalVoteSource) => (
            <FormControl
              name={`id-${answer.id}`}
              value={
                externalVoteSource.voteAmounts?.find(
                  (externalVote: PollExternalVote) => externalVote.answerId === answer.id
                )?.amount || 0
              }
            />
          )}
        </Table.Cell>
      </Table.Column>
    ))
  }

  function addSourceView() {
    return (
      <>
        <Row>
          <Col xs={12}>
            <FormControl
              name="addNewSource"
              placeholder={t('pollExternalVotes.newSourcePlaceholder')}
              value={newSource || ''}
              onChange={setNewSource}
            />
          </Col>
          <Col xs={12}>
            <IconButton icon={<PlusIcon />} appearance="primary" onClick={createPoll}>
              {t('pollExternalVotes.addSourceBtn')}
            </IconButton>
          </Col>
        </Row>
      </>
    )
  }

  function deleteModalView() {
    return (
      <>
        <Modal open={openModal}>
          <Modal.Title>{t('pollExternalVotes.deleteTitle')}</Modal.Title>
          <Modal.Body>{t('pollExternalVotes.deleteBody')}</Modal.Body>
          <Modal.Footer>
            <Button
              appearance="primary"
              onClick={async () => {
                await deletePoll()
              }}>
              {t('pollExternalVotes.deleteExternalVoteBtn')}
            </Button>
            <Button
              appearance="subtle"
              onClick={() => {
                setOpenModal(false)
                setSourceToDelete(undefined)
              }}>
              {t('cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    )
  }

  return (
    <>
      {/* table */}
      {tableView()}
      {/* add new source */}
      {addSourceView()}
      {/* delete modal */}
      {deleteModalView()}
    </>
  )
}
