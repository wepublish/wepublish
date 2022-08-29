import PlusIcon from '@rsuite/icons/legacy/Plus'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Col, IconButton, Message, Row, Table, toaster} from 'rsuite'
import FormControl from 'rsuite/FormControl'

import {FullPoll, PollAnswerWithVoteCount, useCreatePollExternalVoteSourceMutation} from '../../api'

interface PollExternalVotesProps {
  poll?: FullPoll
  onExternalSourceCreated(): Promise<void>
}

export function PollExternalVotes({poll, onExternalSourceCreated}: PollExternalVotesProps) {
  const {t} = useTranslation()
  const [newSource, setNewSource] = useState<string | undefined>(undefined)
  const [createPollMutation, {loading}] = useCreatePollExternalVoteSourceMutation({
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
    await onExternalSourceCreated()
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
        <Table data={poll?.externalVoteSources || []} loading={loading}>
          {/* source */}
          <Table.Column>
            <Table.HeaderCell>{t('pollExternalVotes.sourceHeaderCell')}</Table.HeaderCell>
            <Table.Cell>{(voteSource: any) => voteSource.source}</Table.Cell>
          </Table.Column>
          {/* iterate answers */}
          {iterateAnswersView()}
        </Table>
      </>
    )
  }

  function iterateAnswersView() {
    return poll?.answers?.map((answer: PollAnswerWithVoteCount) => (
      <Table.Column key={answer.id}>
        <Table.HeaderCell>{answer.answer}</Table.HeaderCell>
        <Table.Cell>antwort</Table.Cell>
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
              value={newSource}
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

  return (
    <>
      {/* table */}
      {tableView()}
      {/* add new source */}
      {addSourceView()}
    </>
  )
}
