import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {Col, FlexboxGrid, Form, Message, Row, toaster} from 'rsuite'

import {FullPoll, usePollQuery} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'

export function PollEditView() {
  const params = useParams()
  const [poll, setPoll] = useState<FullPoll | undefined>(undefined)

  const {data, loading, error} = usePollQuery({
    variables: {
      pollId: params.id
    }
  })
  const {t} = useTranslation()

  /**
   * Handling errors
   */
  useEffect(() => {
    if (error?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    }
  }, [error])

  /**
   * Watching poll
   */
  useEffect(() => {
    if (data?.poll) {
      setPoll(data.poll)
    } else {
      setPoll(undefined)
    }
  }, [data])

  /**
   * FUNCTION
   */

  // todo: implement
  function saveOrUpdate() {}

  return (
    <>
      <Form onSubmit={validationPassed => validationPassed && saveOrUpdate()}>
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
          <FlexboxGrid.Item colspan={12}>
            <Row style={{width: '100%'}}>
              <Col xs={24}>
                <Form.Group controlId="question">
                  <Form.ControlLabel>{t('pollEditView.question')}</Form.ControlLabel>
                  <Form.Control
                    name="question"
                    value={poll?.question || undefined}
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
