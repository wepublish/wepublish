import styled from '@emotion/styled'
import {useArticlePreviewLinkQuery} from '@wepublish/editor/api'
import {createCheckedPermissionComponent} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, Message as RMessage, Modal, Slider, toaster} from 'rsuite'

const Message = styled(RMessage)`
  margin-bottom: 20px;
`

const FormGroupTop = styled(Form.Group)`
  padding-top: 20px;
`

const FormGroupHorizontal = styled(Form.Group)`
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

  const {
    data,
    loading: isLoading,
    error: loadError,
    refetch
  } = useArticlePreviewLinkQuery({
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
        <Message type="warning">{t('articleEditor.panels.articlePreviewLinkDesc')}</Message>

        <Form fluid>
          <FormGroupHorizontal controlId="hours">
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
          </FormGroupHorizontal>
          <FormGroupTop controlId="field">
            <Form.ControlLabel>
              {t('articleEditor.panels.articlePreviewLinkField')}
            </Form.ControlLabel>
            <Form.Control
              name="article-preview-link"
              disabled={isLoading}
              value={data?.articlePreviewLink}
            />
          </FormGroupTop>
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
