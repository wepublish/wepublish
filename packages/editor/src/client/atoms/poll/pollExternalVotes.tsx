import {ApolloError} from '@apollo/client'
import PlusIcon from '@rsuite/icons/legacy/Plus'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Col, IconButton, InputNumber, Message, Modal, Row, Table, toaster} from 'rsuite'
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
  onPollChange(poll: FullPoll): void
}

export function PollExternalVotes({poll, onPollChange}: PollExternalVotesProps) {
  const {t} = useTranslation()
  const [newSource, setNewSource] = useState<string | undefined>(undefined)
  const [sourceToDelete, setSourceToDelete] = useState<PollExternalVoteSource | undefined>(
    undefined
  )
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [createExternalVoteSource, {loading}] = useCreatePollExternalVoteSourceMutation({
    fetchPolicy: 'no-cache'
  })
  const [deleteExternalVoteSource] = useDeletePollExternalVoteSourceMutation({
    fetchPolicy: 'no-cache'
  })

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

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

    const createdSource = await createExternalVoteSource({
      variables: {
        pollId: poll.id,
        source: newSource
      },
      onError: onErrorToast
    })
    const source = createdSource?.data?.createPollExternalVoteSource
    if (!source) {
      return
    }
    const updatedPoll = {...poll}
    updatedPoll.externalVoteSources?.push(source)
    onPollChange(updatedPoll)
    setNewSource(undefined)
  }

  async function deletePoll() {
    const id = sourceToDelete?.id
    if (!id) {
      return
    }
    const deletedSource = await deleteExternalVoteSource({
      variables: {
        deletePollExternalVoteSourceId: id
      }
    })
    const source = deletedSource?.data?.deletePollExternalVoteSource
    if (!source || !poll?.externalVoteSources) {
      return
    }
    const deleteIndex = poll.externalVoteSources.findIndex(tmpSource => tmpSource.id === source.id)
    if (deleteIndex < 0) {
      return
    }
    poll.externalVoteSources?.splice(deleteIndex, 1)
    onPollChange({...poll})
    setSourceToDelete(undefined)
    setOpenModal(false)
  }

  /**
   * set a new amount of an external vote source. used to update the parents vote source prop.
   * @param answer
   * @param externalVoteSource
   * @param newAmount
   */
  function changeSource(
    answer: PollAnswerWithVoteCount,
    externalVoteSource: PollExternalVoteSource,
    newAmount: string | number
  ) {
    if (!poll) {
      return
    }
    const newPoll = {...poll} as FullPoll
    const voteSource: PollExternalVoteSource | undefined = newPoll?.externalVoteSources?.find(
      (tmpVoteSource: PollExternalVoteSource) => tmpVoteSource.source === externalVoteSource.source
    )
    if (!voteSource?.voteAmounts) {
      return
    }
    const voteIndex = voteSource.voteAmounts?.findIndex(
      (tmpVote: PollExternalVote) => tmpVote.answerId === answer.id
    )
    if (voteIndex < 0) {
      return
    }
    voteSource.voteAmounts[voteIndex].amount =
      typeof newAmount === 'string' ? parseInt(newAmount) : newAmount
    onPollChange(newPoll)
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
        <Table data={poll?.externalVoteSources || []} loading={loading} autoHeight rowHeight={64}>
          {/* source columns */}
          <Table.Column>
            <Table.HeaderCell>{t('pollExternalVotes.sourceHeaderCell')}</Table.HeaderCell>
            <Table.Cell>{(voteSource: any) => voteSource.source}</Table.Cell>
          </Table.Column>
          {/* iterate answer columns */}
          {iterateAnswerColumns()}
          {/* delete button */}
          <Table.Column>
            <Table.HeaderCell>{t('delete')}</Table.HeaderCell>
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
      <Table.Column key={answer.id} width={150}>
        <Table.HeaderCell>{answer.answer}</Table.HeaderCell>
        <Table.Cell>
          {(externalVoteSource: PollExternalVoteSource) => (
            <InputNumber
              value={
                externalVoteSource.voteAmounts?.find(
                  (externalVote: PollExternalVote) => externalVote.answerId === answer.id
                )?.amount || 0
              }
              onChange={(newValue: string | number) => {
                changeSource(answer, externalVoteSource, newValue)
              }}
            />
          )}
        </Table.Cell>
      </Table.Column>
    ))
  }

  function addSourceView() {
    return (
      <>
        <Row style={{marginTop: '20px'}}>
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
          <Modal.Body>
            {t('pollExternalVotes.deleteBody', {source: sourceToDelete?.source})}
          </Modal.Body>
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
      {tableView()}
      {addSourceView()}
      {deleteModalView()}
    </>
  )
}
