import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {Col, FlexboxGrid, Form, Message, Row, Schema, toaster} from 'rsuite'

import {FullPoll, usePollQuery, useUpdatePollMutation} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'

export function PollEditView() {
  const params = useParams()
  const [poll, setPoll] = useState<FullPoll | undefined>(undefined)

  const {data, loading: createLoading, error} = usePollQuery({
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
  async function saveOrUpdate() {
    if (!poll) {
      return
    }
    await updatePoll({
      variables: {
        pollId: poll.id,
        question: poll.question
      }
    })

    toaster.push(
      <Message type="success" showIcon closable duration={3000}>
        {t('pollEditView.savedSuccessfully')}
      </Message>
    )
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
              saveTitle={t('pollEditView.saveTitle')}
              saveAndCloseTitle={t('pollEditView.saveAndCloseTitle')}
              closePath="/polls"
            />
          </FlexboxGrid.Item>

          {/* content */}
          <FlexboxGrid.Item colspan={8}>
            <Row style={{width: '100%'}}>
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
            </Row>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Form>
    </>
  )
}
