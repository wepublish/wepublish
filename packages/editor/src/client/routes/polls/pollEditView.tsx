import {ApolloError} from '@apollo/client'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Col, DatePicker, FlexboxGrid, Form, Message, Panel, Row, Schema, toaster} from 'rsuite'

import {
  FullPoll,
  PollAnswer,
  PollAnswerWithVoteCount,
  PollExternalVote,
  PollExternalVoteSource,
  usePollQuery,
  useUpdatePollMutation
} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'
import {PollAnswers} from '../../atoms/poll/pollAnswers'
import {PollExternalVotes} from '../../atoms/poll/pollExternalVotes'

export function PollEditView() {
  const params = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState<FullPoll | undefined>(undefined)
  const [close, setClose] = useState<boolean>(false)
  const closePath = '/polls'

  /**
   * Handling toasts
   */
  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }
  const onCompletedToast = () => {
    toaster.push(
      <Message type="success" showIcon closable duration={3000}>
        {t('pollEditView.savedSuccessfully')}
      </Message>
    )
  }

  // get polls
  const {data, loading: createLoading, refetch} = usePollQuery({
    variables: {
      pollId: params.id
    },
    onError: onErrorToast,
    fetchPolicy: 'no-cache'
  })

  // updating poll
  const [updatePoll, {loading: updateLoading, data: updateData}] = useUpdatePollMutation({
    onError: onErrorToast,
    onCompleted: onCompletedToast
  })
  const {t} = useTranslation()
  const loading = createLoading || updateLoading

  /**
   * Update poll object after fetching from api
   */
  useEffect(() => {
    if (data?.poll) {
      setPoll(data.poll)
    } else {
      setPoll(undefined)
    }
  }, [data])

  useEffect(() => {
    if (updateData?.updatePoll) {
      setPoll(updateData.updatePoll)
    } else {
      setPoll(undefined)
    }
  }, [updateData])

  /**
   * Form validation model
   */
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    question: StringType().isRequired(t('pollEditView.questionRequired'))
  })

  /**
   * FUNCTIONS
   */
  async function saveOrUpdate(): Promise<void> {
    if (!poll) {
      return
    }
    const opensAt = poll.opensAt ? new Date(poll.opensAt).toISOString() : null
    const closedAt = poll.closedAt ? new Date(poll.closedAt).toISOString() : null
    const externalSources = poll.externalVoteSources?.map((voteSource: PollExternalVoteSource) => ({
      ...voteSource,
      __typename: undefined,
      voteAmounts: voteSource.voteAmounts?.map((voteAmount: PollExternalVote) => ({
        id: voteAmount.id,
        amount: voteAmount.amount
      }))
    }))

    await updatePoll({
      variables: {
        pollId: poll.id,
        question: poll.question,
        opensAt,
        closedAt,
        answers: poll.answers?.map(answer => {
          return {
            id: answer.id,
            answer: answer.answer
          }
        }),
        externalVoteSources: externalSources || []
      }
    })

    if (close) {
      navigate(closePath)
    }
  }

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && saveOrUpdate()}
        model={validationModel}
        fluid
        disabled={loading}
        formValue={{question: poll?.question}}>
        <FlexboxGrid>
          {/* model title */}
          <FlexboxGrid.Item colspan={24}>
            <ModelTitle
              loading={loading}
              title={poll?.question || t('pollList.noQuestion')}
              loadingTitle={t('pollEditView.loadingTitle')}
              saveBtnTitle={t('pollEditView.saveTitle')}
              saveAndCloseBtnTitle={t('pollEditView.saveAndCloseTitle')}
              closePath={closePath}
              setCloseFn={setClose}
            />
          </FlexboxGrid.Item>

          {/* content */}
          <FlexboxGrid.Item colspan={12}>
            <Row>
              {/* question */}
              <Col xs={24}>
                <Panel header={t('pollEditView.questionPanelHeader')} bordered>
                  <Form.Group controlId="question">
                    <Form.Control
                      name="question"
                      placeholder={t('pollEditView.toBeOrNotToBe')}
                      value={poll?.question || ''}
                      onChange={(value: string) => {
                        if (!poll) {
                          return
                        }
                        setPoll(p => ({...p, question: value}))
                      }}
                    />
                  </Form.Group>
                </Panel>
              </Col>
              {/* answers */}
              <Col xs={24}>
                <Panel header={t('pollEditView.answerPanelHeader')} bordered>
                  <PollAnswers
                    poll={poll}
                    onAnswerAdded={async (answer: PollAnswer) => {
                      if (!poll?.answers) {
                        return
                      }
                      poll.answers.push(answer as PollAnswerWithVoteCount)
                      await saveOrUpdate()
                    }}
                    onAnswerDeleted={async () => {
                      await refetch()
                    }}
                    onPollUpdated={poll => {
                      setPoll(poll)
                    }}
                  />
                </Panel>
              </Col>
              {/* settings */}
              <Col xs={24}>
                <Panel header={t('pollEditView.settingsPanelHeader')} bordered>
                  {/* opens at */}
                  <Form.ControlLabel style={{marginRight: '5px'}}>
                    {t('pollEditView.opensAtLabel')}
                  </Form.ControlLabel>
                  <DatePicker
                    value={poll?.opensAt ? new Date(poll.opensAt) : undefined}
                    format="yyyy-MM-dd HH:mm"
                    onChange={(opensAt: Date | null) => {
                      if (!poll) {
                        return
                      }
                      setPoll({
                        ...poll,
                        opensAt: opensAt?.toISOString() || new Date().toISOString()
                      })
                    }}
                  />

                  {/* closes at */}
                  <Form.ControlLabel style={{marginLeft: '20px', marginRight: '5px'}}>
                    {t('pollEditView.closesAtLabel')}
                  </Form.ControlLabel>
                  <DatePicker
                    value={poll?.closedAt ? new Date(poll.closedAt) : undefined}
                    format="yyyy-MM-dd HH:mm"
                    onChange={(closedAt: Date | null) => {
                      if (!poll) {
                        return
                      }
                      setPoll({...poll, closedAt: closedAt?.toISOString()})
                    }}
                  />
                </Panel>
              </Col>
              {/* poll external votes */}
              <Col xs={24}>
                <Panel header={t('pollEditView.pollExternalVotesPanelHeader')} bordered>
                  <PollExternalVotes
                    poll={poll}
                    onExternalSourceCreated={async () => {
                      await refetch()
                    }}
                    onExternalSourceDeleted={async () => {
                      await refetch()
                    }}
                    onExternalSourceChange={(externalVoteSources: PollExternalVoteSource[]) => {
                      if (!poll) {
                        return
                      }
                      setPoll({...poll, externalVoteSources})
                    }}
                    savePoll={saveOrUpdate}
                  />
                </Panel>
              </Col>
            </Row>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Form>
    </>
  )
}
