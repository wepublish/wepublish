import styled from '@emotion/styled'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer, Input as RInput} from 'rsuite'

import {HTMLBlockValue} from '../blocks/types'

const Warning = styled.div`
  margin-top: 20px;
`

const Input = styled(RInput)`
  width: 100%;
`

export interface HtmlEditPanelProps {
  readonly value: HTMLBlockValue
  onClose(): void
  onConfirm(value: HTMLBlockValue): void
}

export function HtmlEditPanel({value, onClose, onConfirm}: HtmlEditPanelProps) {
  const [htmlBlock, setHtmlBlock] = useState<HTMLBlockValue>(value)
  const isEmpty = htmlBlock === undefined
  const {t} = useTranslation()

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.html.edit')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance="primary" disabled={isEmpty} onClick={() => onConfirm(htmlBlock)}>
            {t('blocks.html.confirm')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('blocks.html.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Input
          as="textarea"
          rows={3}
          placeholder={t('blocks.html.placeholder')}
          value={htmlBlock.html}
          onChange={input => setHtmlBlock({html: input})}
        />
        <Warning>
          <span>{t('blocks.html.warning')}</span>
        </Warning>
      </Drawer.Body>
    </>
  )
}
