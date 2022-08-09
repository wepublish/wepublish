import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {toaster, Button, Form, Message, Modal, Slider} from 'rsuite'

import {useArticlePreviewLinkQuery} from '../api'

export interface ArticlePreviewProps {
  id: string
}

export interface ArticlePreviewLinkPanelProps {
  props: ArticlePreviewProps

  onClose(): void
}

export function ArticlePreviewLinkPanel({props, onClose}: ArticlePreviewLinkPanelProps) {
  const [hours, setHours] = useState<number>(12)

  const {t} = useTranslation()

  const {data, loading: isLoading, error: loadError, refetch} = useArticlePreviewLinkQuery({
    variables: {
      id: props.id,
      hours
    }
  })

  useEffect(() => {
    refetch({id: props.id, hours})
  }, [hours])

  useEffect(() => {
    if (loadError?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {loadError.message}
        </Message>
      )
    }
  }, [loadError])

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('articleEditor.panels.articlePreviewLink')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Message style={{marginBottom: '20px'}} type="warning">
          {t('articleEditor.panels.articlePreviewLinkDesc')}
        </Message>

        <Form fluid>
          <Form.Group style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <Form.ControlLabel>
              {t('articleEditor.panels.articlePreviewLinkHours')}
            </Form.ControlLabel>
            <Slider
              value={hours}
              min={6}
              step={6}
              max={48}
              graduated
              progress
              renderMark={mark => {
                return `${mark} h`
              }}
              onChange={value => setHours(value)}
            />
          </Form.Group>
          <Form.Group style={{paddingTop: '20px'}}>
            <Form.ControlLabel>
              {t('articleEditor.panels.articlePreviewLinkField')}
            </Form.ControlLabel>
            <Form.Control
              name="article-preview-link"
              disabled={isLoading}
              value={data?.articlePreviewLink}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
