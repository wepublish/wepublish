import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Col, FlexboxGrid, Form, Message, Panel, Row, Schema, toaster} from 'rsuite'

import {
  FullPoll,
  PollAnswer,
  PollAnswerWithVoteCount,
  usePollQuery,
  useUpdatePollMutation
} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'
import {PollAnswers} from '../../atoms/poll/pollAnswers'

export function PollEditView() {
  const params = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState<FullPoll | undefined>(undefined)
  const [close, setClose] = useState<boolean>(false)
  const closePath = '/polls'

  const {data, loading: createLoading, error, refetch} = usePollQuery({
    variables: {
      pollId: params.id
    },
    fetchPolicy: 'no-cache'
  })
  const [
    updatePoll,
    {loading: updateLoading, data: updateData, error: updateError}
  ] = useUpdatePollMutation()
  const {t} = useTranslation()
  const loading = createLoading || updateLoading

  /**
   * Handling errors
   */
  useEffect(() => {
    if (error?.message || updateError?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error?.message || updateError?.message}
        </Message>
      )
    }
  }, [error, updateError])

  /**
   * Update poll object after fetching from api
   */
  useEffect(() => {
    if (data?.poll) {
      setPoll(data.poll)
    } else if (updateData?.updatePoll) {
      setPoll(updateData.updatePoll)
    } else {
      setPoll(undefined)
    }
  }, [data, updateData])

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
    await updatePoll({
      variables: {
        pollId: poll.id,
        question: poll.question,
        answers: poll.answers
      }
    })

    toaster.push(
      <Message type="success" showIcon closable duration={3000}>
        {t('pollEditView.savedSuccessfully')}
      </Message>
    )

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
          <FlexboxGrid.Item colspan={8}>
            <Row>
              <Col xs={24}>
                {/* question */}
                <Form.Group controlId="question">
                  <Form.ControlLabel>{t('pollEditView.question')}</Form.ControlLabel>
                  <Form.Control
                    name="question"
                    placeholder={t('pollEditView.toBeOrNotToBe')}
                    value={poll?.question || ''}
                    disabled={loading}
                    onChange={(value: string) => {
                      if (!poll) {
                        return
                      }
                      setPoll({...poll, question: value})
                    }}
                  />
                </Form.Group>
              </Col>
              {/* answers */}
              <Col xs={24}>
                <Panel header={t('pollEditView.answerPanelHeader')} bordered>
                  <PollAnswers
                    poll={poll}
                    onNewAnswerSaved={async (answer: PollAnswer) => {
                      if (!poll?.answers) {
                        return
                      }
                      poll.answers.push(answer as PollAnswerWithVoteCount)
                      await saveOrUpdate()
                    }}
                    onPollChange={poll => {
                      setPoll(poll)
                    }}
                    onAnswerDeleted={async () => {
                      await refetch()
                    }}
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
