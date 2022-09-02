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
  onExternalSourceCreated(): Promise<void>
  onExternalSourceDeleted(): Promise<void>
  onExternalSourceChange(externalVoteSources: PollExternalVoteSource[]): void
  savePoll(): Promise<void>
}

export function PollExternalVotes({
  poll,
  onExternalSourceCreated,
  onExternalSourceDeleted,
  onExternalSourceChange,
  savePoll
}: PollExternalVotesProps) {
  const {t} = useTranslation()
  const [newSource, setNewSource] = useState<string | undefined>(undefined)
  const [sourceToDelete, setSourceToDelete] = useState<PollExternalVoteSource | undefined>(
    undefined
  )
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [createSourceMutation, {loading}] = useCreatePollExternalVoteSourceMutation({
    fetchPolicy: 'no-cache'
  })
  const [deletePollMutation] = useDeletePollExternalVoteSourceMutation({
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
    // first save current poll state
    await savePoll()

    await createSourceMutation({
      variables: {
        pollId: poll.id,
        source: newSource
      },
      onError: onErrorToast
    })
    setNewSource(undefined)
    await onExternalSourceCreated()
  }

  async function deletePoll() {
    const id = sourceToDelete?.id
    if (!id) {
      return
    }
    // first save current poll state
    await savePoll()
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
    const voteSources = poll?.externalVoteSources
    if (!voteSources) {
      return
    }
    // deep clone
    const newVoteSources: PollExternalVoteSource[] = [...voteSources]

    const sourceIndex = newVoteSources.findIndex(
      (tmpVoteSource: PollExternalVoteSource) => tmpVoteSource.source === externalVoteSource.source
    )
    if (sourceIndex < 0) {
      return
    }

    const source = newVoteSources[sourceIndex]
    if (!source?.voteAmounts) {
      return
    }

    const voteIndex = source.voteAmounts?.findIndex(
      (tmpVote: PollExternalVote) => tmpVote.answerId === answer.id
    )
    if (voteIndex < 0) {
      return
    }
    source.voteAmounts[voteIndex].amount =
      typeof newAmount === 'string' ? parseInt(newAmount) : newAmount

    onExternalSourceChange(newVoteSources)
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
      {/* table */}
      {tableView()}
      {/* add new source */}
      {addSourceView()}
      {/* delete modal */}
      {deleteModalView()}
    </>
  )
}
