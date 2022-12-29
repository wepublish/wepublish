import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, Message, Modal, Slider, toaster} from 'rsuite'

import {useArticlePreviewLinkQuery} from '../api'
import {createCheckedPermissionComponent} from '../atoms/permissionControl'

const StyledMessage = styled(Message)`
  margin-bottom: 20px;
`

const StyledFormGroupTop = styled(Form.Group)`
  padding-top: 20px;
`

const StyledFormGroupHorizontal = styled(Form.Group)`
  padding-left: 20px;
  padding-right: 20px;
`

export interface ArticlePreviewProps {
  id: string
}

export interface ArticlePreviewLinkPanelProps {
  props: ArticlePreviewProps

  onClose(): void
}

function ArticlePreviewLinkPanel({props, onClose}: ArticlePreviewLinkPanelProps) {
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
        <StyledMessage type="warning">
          {t('articleEditor.panels.articlePreviewLinkDesc')}
        </StyledMessage>

        <Form fluid>
          <StyledFormGroupHorizontal controlId="hours">
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
          </StyledFormGroupHorizontal>
          <StyledFormGroupTop controlId="field">
            <Form.ControlLabel>
              {t('articleEditor.panels.articlePreviewLinkField')}
            </Form.ControlLabel>
            <Form.Control
              name="article-preview-link"
              disabled={isLoading}
              value={data?.articlePreviewLink}
            />
          </StyledFormGroupTop>
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

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLE_PREVIEW_LINK'
])(ArticlePreviewLinkPanel)
export {CheckedPermissionComponent as ArticlePreviewLinkPanel}
